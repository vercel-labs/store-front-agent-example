// Plain data access shared by the pages, the server actions, and the agent's tools.
// Nothing here touches Next.js request APIs; see lib/cart-cookie.ts for the cookie.
import { db } from "./db";

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  image: string;
  options: Record<string, string[]>;
}

export interface CartLine {
  product: Product;
  variant: string;
  quantity: number;
}

export interface OrderItem {
  slug: string;
  name: string;
  variant: string;
  quantity: number;
  priceCents: number;
}

export interface Order {
  number: string;
  email: string;
  status: string;
  placedAt: string;
  items: OrderItem[];
}

function toProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as number,
    slug: row.slug as string,
    name: row.name as string,
    category: row.category as string,
    description: row.description as string,
    priceCents: row.price_cents as number,
    image: row.image as string,
    options: row.options as Record<string, string[]>,
  };
}

// The driver returns `date` columns as JS Dates at local midnight.
function isoDate(value: unknown): string {
  const d = value instanceof Date ? value : new Date(String(value));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toOrder(row: Record<string, unknown>): Order {
  return {
    number: row.number as string,
    email: row.email as string,
    status: row.status as string,
    placedAt: isoDate(row.placed_at),
    items: row.items as OrderItem[],
  };
}

// Catalog

export async function getProducts(category?: string): Promise<Product[]> {
  const sql = await db();
  const rows = category
    ? await sql`select * from products where category = ${category} order by id`
    : await sql`select * from products order by id`;
  return rows.map(toProduct);
}

export async function searchProducts(filters: {
  query?: string;
  category?: string;
  maxPriceCents?: number;
}): Promise<Product[]> {
  const sql = await db();
  const pattern = filters.query ? `%${filters.query}%` : null;
  const rows = await sql`
    select * from products
    where (${pattern}::text is null or name ilike ${pattern} or description ilike ${pattern} or category ilike ${pattern})
      and (${filters.category ?? null}::text is null or category ilike ${filters.category ?? null})
      and (${filters.maxPriceCents ?? null}::int is null or price_cents <= ${filters.maxPriceCents ?? null})
    order by id
    limit 12`;
  return rows.map(toProduct);
}

// Products spelled close to the query, best first. pg_trgm compares words by their
// overlapping three-letter chunks, so "sweaater" still scores 0.7 against "Sweater".
// 0.35 keeps "beenie" -> Wool Beanie and drops "shrts", which matches nothing we sell.
// A gin_trgm_ops index would matter for a large catalog; twenty rows need none.
export async function findSimilarProducts(query: string, limit = 8): Promise<SimilarProduct[]> {
  const sql = await db();
  const rows = await sql`
    select *, greatest(word_similarity(${query}, name), word_similarity(${query}, category)) as similarity
    from products
    where greatest(word_similarity(${query}, name), word_similarity(${query}, category)) >= 0.35
    order by similarity desc
    limit ${limit}`;
  return rows.map((row) => ({ ...toProduct(row), similarity: Number(row.similarity) }));
}

export interface SimilarProduct extends Product {
  /** 0 to 1. How close the spelling is to the query. */
  similarity: number;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const sql = await db();
  const [row] = await sql`select * from products where slug = ${slug}`;
  return row && toProduct(row);
}

export async function getCategories(): Promise<string[]> {
  const sql = await db();
  const rows = await sql`select distinct category from products order by category`;
  return rows.map((r) => r.category as string);
}

// Cart. The cart id lives in a browser cookie; nothing else identifies the shopper.

export async function createCart(): Promise<string> {
  const sql = await db();
  const [{ id }] = await sql`insert into carts default values returning id`;
  return id as string;
}

export async function getCart(cartId?: string): Promise<CartLine[]> {
  if (!cartId) return [];
  const sql = await db();
  const rows = await sql`
    select p.*, ci.variant, ci.quantity
    from cart_items ci join products p on p.id = ci.product_id
    where ci.cart_id = ${cartId}
    order by p.name, ci.variant`;
  return rows.map((row) => ({
    product: toProduct(row),
    variant: row.variant as string,
    quantity: row.quantity as number,
  }));
}

export async function getCartCount(cartId?: string): Promise<number> {
  if (!cartId) return 0;
  const sql = await db();
  const [{ count }] =
    await sql`select coalesce(sum(quantity), 0)::int as count from cart_items where cart_id = ${cartId}`;
  return count;
}

export async function addCartItem(cartId: string, productId: number, variant: string, quantity = 1) {
  const sql = await db();
  await sql`insert into carts (id) values (${cartId}) on conflict do nothing`;
  await sql`
    insert into cart_items (cart_id, product_id, variant, quantity)
    values (${cartId}, ${productId}, ${variant}, ${quantity})
    on conflict (cart_id, product_id, variant)
    do update set quantity = cart_items.quantity + excluded.quantity`;
}

export async function setCartItemQuantity(cartId: string, productId: number, variant: string, quantity: number) {
  const sql = await db();
  if (quantity <= 0) {
    await sql`delete from cart_items where cart_id = ${cartId} and product_id = ${productId} and variant = ${variant}`;
  } else {
    await sql`update cart_items set quantity = ${quantity}
              where cart_id = ${cartId} and product_id = ${productId} and variant = ${variant}`;
  }
}

export async function clearCart(cartId: string) {
  const sql = await db();
  await sql`delete from cart_items where cart_id = ${cartId}`;
}

// Orders

export async function createOrder(email: string, lines: CartLine[]): Promise<Order> {
  const sql = await db();
  const items: OrderItem[] = lines.map((l) => ({
    slug: l.product.slug,
    name: l.product.name,
    variant: l.variant,
    quantity: l.quantity,
    priceCents: l.product.priceCents,
  }));
  const [row] = await sql`
    insert into orders (email, status, placed_at, items)
    values (${email}, 'processing', current_date, ${JSON.stringify(items)}::jsonb)
    returning *`;
  return toOrder(row);
}

export async function getOrder(number: string, email?: string): Promise<Order | undefined> {
  const sql = await db();
  const rows = email
    ? await sql`select * from orders where number = ${number} and lower(email) = lower(${email})`
    : await sql`select * from orders where number = ${number}`;
  return rows[0] && toOrder(rows[0]);
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.product.priceCents * l.quantity, 0);
}

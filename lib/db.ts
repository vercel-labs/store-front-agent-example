import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

import orders from "../data/orders.json";
import products from "../data/products.json";
import { schema } from "../db/schema";

export const hasDatabase = Boolean(process.env.DATABASE_URL);

type Sql = NeonQueryFunction<false, false>;

function client(): Sql {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  return neon(process.env.DATABASE_URL);
}

// Runs once per server instance. Creates the tables and, if the catalog is empty,
// loads data/products.json and data/orders.json. Every step is idempotent, so a
// second instance racing the first cannot corrupt anything.
let ready: Promise<void> | undefined;

async function seed(sql: Sql) {
  for (const statement of schema) await sql.query(statement);

  const [{ count }] = await sql`select count(*)::int as count from products`;
  if (count > 0) return;

  await sql.transaction([
    ...products.map(
      (p) => sql`
        insert into products (slug, name, category, description, price_cents, image, options)
        values (${p.slug}, ${p.name}, ${p.category}, ${p.description}, ${p.priceCents},
                ${`/products/${p.slug}.svg`}, ${JSON.stringify(p.options)}::jsonb)
        on conflict (slug) do nothing`,
    ),
    ...orders.map(
      (o) => sql`
        insert into orders (email, status, placed_at, items)
        values (${o.email}, ${o.status}, ${o.placedAt}, ${JSON.stringify(o.items)}::jsonb)`,
    ),
  ]);
}

export function db() {
  const sql = client();
  ready ??= seed(sql).catch((error) => {
    ready = undefined;
    throw error;
  });
  return ready.then(() => sql);
}

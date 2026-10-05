// Applied automatically on the app's first request (see lib/db.ts).
// Every statement is idempotent, so running it again is harmless.
export const schema = [
  // Trigram similarity for typo-tolerant search. See findSimilarProducts in lib/store.ts.
  `create extension if not exists pg_trgm`,

  `create table if not exists products (
    id serial primary key,
    slug text unique not null,
    name text not null,
    category text not null,
    description text not null,
    price_cents integer not null,
    image text not null,
    options jsonb not null default '{}'
  )`,

  `create table if not exists carts (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now()
  )`,

  `create table if not exists cart_items (
    cart_id uuid not null references carts (id) on delete cascade,
    product_id integer not null references products (id),
    variant text not null default '',
    quantity integer not null check (quantity > 0),
    primary key (cart_id, product_id, variant)
  )`,

  `create table if not exists orders (
    id serial primary key,
    number text generated always as ((1000 + id)::text) stored,
    email text not null,
    status text not null,
    placed_at date not null,
    items jsonb not null
  )`,
];

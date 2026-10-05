// Drops every table. The app recreates and reseeds them on its next request.
// Usage: npm run db:reset
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Run `vercel env pull` first.");

const sql = neon(url);
await sql`drop table if exists cart_items, carts, orders, products`;
console.log("Dropped all tables. Start the app to reseed.");

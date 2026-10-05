# Northstar Goods - Example Storefront with Jev-powered Search and Agent via Vercel AI Gateway

A demo storefront with an AI shopping assistant. It is a Next.js app backed by a Neon Postgres database, with an [Eve](https://eve.dev) agent that picks a model for each message based on what the shopper is asking.

## Getting started

You can set this up with the Deploy button or by hand. Either way, the assistant uses the project's OIDC token to call AI Gateway, so you don't need to set any API keys. Model usage is billed to your Vercel team through AI Gateway.

### Option 1: Deploy button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fstore-front-agent-example&project-name=store-front&repository-name=store-front&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

The button copies this repo into your GitHub account, creates a Vercel project and a free Neon database, connects them, and deploys. The first request to the site creates the tables and loads the sample catalog.

To run your copy locally, you need Node 24 and the [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`):

```bash
git clone https://github.com/<your-account>/store-front
cd store-front
npm install
vercel link
vercel env pull
npm run dev
```

When `vercel link` asks, pick the project the button created. If `vercel env pull` doesn't bring down `DATABASE_URL`, connect the Neon database to the Development environment in the project's Storage tab and pull again.

### Option 2: Set up by hand

You need Node 24 and the [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`).

1. Clone the repo and install dependencies.

   ```bash
   git clone https://github.com/vercel-labs/store-front-agent-example
   cd store-front-agent-example
   npm install
   ```

2. Create a Vercel project and link the folder to it.

   ```bash
   vercel link
   ```

3. Add a Neon database to the project. In the dashboard, go to Storage, then Create Database, then Neon, and check Development, Preview, and Production when you connect it. Or from the CLI:

   ```bash
   vercel install neon --plan free_v3 -e production -e preview -e development
   ```

4. Pull the environment variables into `.env.local`. This gets `DATABASE_URL` and an OIDC token for AI Gateway.

   ```bash
   vercel env pull
   ```

5. Start the app and open http://localhost:3000. The first request creates the tables and loads the catalog.

   ```bash
   npm run dev
   ```

6. When you're ready, deploy it.

   ```bash
   vercel deploy --prod
   ```

### Notes

- The OIDC token in `.env.local` expires after about 12 hours. If the assistant stops responding locally, run `vercel env pull` again.
- If your Vercel CLI defaults to a different team than the project's, add `--scope <team>` to the `vercel` commands.

## Things to try

Open the assistant with the "Ask the store" button and try:

- "a jacket under $150"
- "does the trail shell jacket run big? I wear a medium"
- "add the wool beanie in charcoal to my cart"
- "what's in my cart?"
- "how long does shipping take?" then "does that apply to Alaska?"
- "I want to return the beanie from order 1001, my email is demo@example.com"

Under each message, the drawer shows the intent that was detected and the model that answered. Ask a sizing question and then a returns question to see the model change.

The search box in the header also handles typos ("sweaater") and vague terms ("athletic").

## How it works

**The store** is a regular Next.js app: a product grid, product pages, a cookie-based cart, and a demo checkout that creates an order without taking payment. All data access goes through `lib/store.ts`. The database is only reachable from the server.

**The assistant** is an Eve agent in `agent/`. For each message:

1. The chat drawer sends the message to `/api/agent/intent`, which uses [jev](https://ai-sdk.dev/docs/ai-sdk-core/evaluation) to classify it into one of seven intents (sizing, shipping, returns, and so on).
2. The intent is looked up in the `ROUTES` table in `agent/agent.ts`. Each row sets the model, a fallback model, the reasoning effort, and an optional skill.
3. Eve runs the turn on that model. The model loads the skill if there is one and answers using the store's tools, which call the same `lib/store.ts` functions the pages use.

To change which model handles what, edit `ROUTES` in `agent/agent.ts`. The intents are defined in `agent/lib/classify.ts`. Skills are short markdown files in `agent/skills/`.

The cart ID comes from the browser cookie, not from the model, so the assistant can only see and change the current shopper's cart.

## Project layout

```
app/
  page.tsx                    Home: product grid with category filter
  products/[slug]/page.tsx    Product page
  search/page.tsx             Search results
  cart/page.tsx               Cart and demo checkout
  orders/[number]/page.tsx    Order confirmation
  setup/page.tsx              Shown when DATABASE_URL is missing
  actions.ts                  Server actions for the cart and checkout
  api/agent/intent/route.ts   Classifies a message and returns the route
  api/agent/session/route.ts  Makes sure the cart cookie exists before chatting
  api/search/intent/route.ts  The search fallback as JSON

agent/
  agent.ts                    Routing table and per-turn model selection
  instructions.md             The assistant's system prompt
  channels/eve.ts             Chat endpoint; attaches the cart to the session
  lib/classify.ts             Intents and the jev classifier
  tools/                      Catalog, cart, and order tools
  skills/                     Sizing, returns, promotions, shipping, technical support

components/
  agent/chat.tsx              Chat drawer
  header.tsx, product-card.tsx, setup.tsx

lib/
  db.ts                       Neon client; creates tables and seeds on first use
  store.ts                    Products, carts, orders, and search queries
  search-intent.ts            jev fallback for search
  cart-cookie.ts, format.ts

db/
  schema.ts                   Table definitions
  images.ts                   Generates the product SVGs (npm run db:images)
  reset.ts                    Drops all tables (npm run db:reset)

data/
  products.json               The catalog
  orders.json                 Demo orders
```

## Environment variables

| Variable | Set by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Neon integration | Postgres connection string |
| `VERCEL_OIDC_TOKEN` | Vercel | Authenticates to AI Gateway |
| `AI_GATEWAY_API_KEY` | You (optional) | Use an API key instead of OIDC |

## Changing the catalog

The app only seeds when the products table is empty. After editing `data/products.json` or `data/orders.json`, drop the tables so the next request reseeds:

```bash
npm run db:reset
```

Run `npm run db:images` to regenerate product images for any new products.

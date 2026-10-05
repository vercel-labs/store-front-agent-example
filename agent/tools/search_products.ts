import { defineTool } from "eve/tools";
import { z } from "zod";

import { searchProducts } from "../../lib/store";
import { toCard } from "../lib/products";

export default defineTool({
  description:
    "Search the catalog by keyword, category, or maximum price. Returns up to 12 products, which the panel renders as cards.",
  inputSchema: z.object({
    query: z.string().max(100).optional().describe("Words to match against name, description, or category."),
    category: z.string().max(50).optional().describe("One of: Apparel, Bags, Accessories, Home."),
    maxPriceCents: z.number().int().positive().optional().describe("Omit when the shopper gave no maximum."),
  }),
  label: { start: ({ query, category }) => `Search ${query ?? category ?? "the catalog"}` },
  async execute({ query, category, maxPriceCents }) {
    // Models sometimes send a huge number to mean "no limit"; treat anything implausible as unset.
    const cap = maxPriceCents && maxPriceCents < 1_000_000 ? maxPriceCents : undefined;
    const products = await searchProducts({ query, category, maxPriceCents: cap });
    return { products: products.map(toCard) };
  },
});

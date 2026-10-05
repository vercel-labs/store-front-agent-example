import { defineTool } from "eve/tools";
import { z } from "zod";

import { getProduct } from "../../lib/store";
import { toCard } from "../lib/products";

// Lets the agent put product cards in the chat while it talks, not only when it
// searches. The panel renders any tool output that contains `products`.
export default defineTool({
  description:
    "Show product cards in the chat for the given slugs. Call this whenever you discuss or recommend specific products, so the shopper sees them.",
  inputSchema: z.object({ slugs: z.array(z.string().max(100)).min(1).max(4) }),
  label: { start: ({ slugs }) => `Show ${slugs.join(", ")}` },
  async execute({ slugs }) {
    const products = await Promise.all(slugs.map((slug) => getProduct(slug)));
    return { products: products.filter((p) => p !== undefined).map(toCard) };
  },
});

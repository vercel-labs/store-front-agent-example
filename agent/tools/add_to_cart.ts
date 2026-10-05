import { defineTool } from "eve/tools";
import { z } from "zod";

import { addCartItem, getProduct } from "../../lib/store";
import { cartSummary, sessionCartId } from "../lib/cart";

export default defineTool({
  description:
    "Add a product to the shopper's cart. Only when the shopper asks. For products with options, pass the chosen values joined with ' / ' in the order listed, e.g. 'M / Olive'.",
  inputSchema: z.object({
    slug: z.string().max(100),
    variant: z.string().max(100).default(""),
    quantity: z.number().int().min(1).max(20).default(1),
  }),
  label: { start: ({ slug, quantity }) => `Add ${quantity} × ${slug}` },
  async execute({ slug, variant, quantity }, ctx) {
    const cartId = sessionCartId(ctx);
    if (!cartId) return { error: "No cart is available. Ask the shopper to reload the page." };
    const product = await getProduct(slug);
    if (!product) return { error: `No product with slug "${slug}".` };
    await addCartItem(cartId, product.id, variant, quantity);
    return { added: { name: product.name, variant, quantity }, cart: await cartSummary(cartId) };
  },
});

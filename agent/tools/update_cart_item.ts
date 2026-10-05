import { defineTool } from "eve/tools";
import { z } from "zod";

import { getProduct, setCartItemQuantity } from "../../lib/store";
import { cartSummary, sessionCartId } from "../lib/cart";

export default defineTool({
  description:
    "Change the quantity of a cart line, or remove it with quantity 0. Use the slug and variant exactly as get_cart reports them.",
  inputSchema: z.object({
    slug: z.string().max(100),
    variant: z.string().max(100).default(""),
    quantity: z.number().int().min(0).max(20),
  }),
  label: { start: ({ slug, quantity }) => (quantity === 0 ? `Remove ${slug}` : `Set ${slug} to ${quantity}`) },
  async execute({ slug, variant, quantity }, ctx) {
    const cartId = sessionCartId(ctx);
    if (!cartId) return { error: "No cart is available. Ask the shopper to reload the page." };
    const product = await getProduct(slug);
    if (!product) return { error: `No product with slug "${slug}".` };
    await setCartItemQuantity(cartId, product.id, variant, quantity);
    return { cart: await cartSummary(cartId) };
  },
});

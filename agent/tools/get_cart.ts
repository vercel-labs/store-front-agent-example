import { defineTool } from "eve/tools";
import { z } from "zod";

import { cartSummary, sessionCartId } from "../lib/cart";

export default defineTool({
  description: "Show what is in the shopper's cart.",
  inputSchema: z.object({}),
  label: { start: () => "Check the cart" },
  async execute(_input, ctx) {
    const cartId = sessionCartId(ctx);
    if (!cartId) return { lines: [], totalCents: 0 };
    return cartSummary(cartId);
  },
});

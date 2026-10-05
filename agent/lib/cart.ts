import type { ToolContext } from "eve/tools";

import { cartTotal, getCart } from "../../lib/store";

// The cart id was attached to the session by agent/channels/eve.ts from the browser cookie.
export function sessionCartId(ctx: ToolContext): string | undefined {
  const cartId = ctx.session.auth.current?.attributes.cartId;
  return typeof cartId === "string" ? cartId : undefined;
}

export async function cartSummary(cartId: string) {
  const lines = await getCart(cartId);
  return {
    lines: lines.map((l) => ({
      slug: l.product.slug,
      name: l.product.name,
      variant: l.variant,
      quantity: l.quantity,
      priceCents: l.product.priceCents,
    })),
    totalCents: cartTotal(lines),
  };
}

import { getOrCreateCartId } from "@/lib/cart-cookie";

// Called by the chat panel before its first message so the cart cookie exists.
// The agent's channel reads that cookie and binds the session to the cart.
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return new Response(null, { status: 403 });
  }
  await getOrCreateCartId();
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

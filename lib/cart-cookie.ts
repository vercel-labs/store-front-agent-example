// Next.js-only cookie helpers. Kept apart from lib/store.ts so the agent runtime,
// which is not a Next.js process, can import the store without pulling in next/headers.
import { cookies } from "next/headers";

import { createCart } from "./store";

export const CART_COOKIE = "cart_id";

export async function getCartId(): Promise<string | undefined> {
  return (await cookies()).get(CART_COOKIE)?.value;
}

export async function getOrCreateCartId(): Promise<string> {
  const existing = await getCartId();
  if (existing) return existing;
  const id = await createCart();
  (await cookies()).set(CART_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
  return id;
}

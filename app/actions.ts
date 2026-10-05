"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCartId, getOrCreateCartId } from "@/lib/cart-cookie";
import { addCartItem, clearCart, createOrder, getCart, setCartItemQuantity } from "@/lib/store";

export async function addToCart(formData: FormData) {
  const productId = Number(formData.get("productId"));
  // Each <select name="option:Size"> etc. contributes one part, e.g. "M / Olive".
  const variant = [...formData.entries()]
    .filter(([key]) => key.startsWith("option:"))
    .map(([, value]) => String(value))
    .join(" / ");
  const cartId = await getOrCreateCartId();
  await addCartItem(cartId, productId, variant);
  cartChanged();
  redirect("/cart");
}

// The header's cart count lives in the root layout, which the client router keeps
// cached across navigations. Invalidate it so the count updates immediately.
function cartChanged() {
  revalidatePath("/", "layout");
}

export async function updateQuantity(formData: FormData) {
  const cartId = await getCartId();
  if (!cartId) return;
  await setCartItemQuantity(
    cartId,
    Number(formData.get("productId")),
    String(formData.get("variant") ?? ""),
    Number(formData.get("quantity")),
  );
  cartChanged();
  redirect("/cart");
}

export async function placeOrder(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const cartId = await getCartId();
  const lines = await getCart(cartId);
  if (!cartId || !email || lines.length === 0) redirect("/cart");
  const order = await createOrder(email, lines);
  await clearCart(cartId);
  cartChanged();
  redirect(`/orders/${order.number}`);
}

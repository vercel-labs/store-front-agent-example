import Link from "next/link";

import { placeOrder, updateQuantity } from "@/app/actions";
import { formatPrice } from "@/lib/format";
import { getCartId } from "@/lib/cart-cookie";
import { cartTotal, getCart } from "@/lib/store";

export default async function CartPage() {
  const lines = await getCart(await getCartId());

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-2xl font-semibold">Cart</h1>
        <ul className="mt-6 divide-y divide-neutral-200">
          {lines.map(({ product, variant, quantity }) => (
            <li key={`${product.id}:${variant}`} className="flex gap-4 py-4">
              <img src={product.image} alt="" width={96} height={96} className="size-24 rounded-lg ring-1 ring-neutral-200" />
              <div className="flex flex-1 flex-col">
                <Link href={`/products/${product.slug}`} className="font-medium hover:underline">
                  {product.name}
                </Link>
                {variant && <p className="text-sm text-neutral-500">{variant}</p>}
                <p className="mt-auto text-sm">{formatPrice(product.priceCents * quantity)}</p>
              </div>
              <form action={updateQuantity} className="flex items-start gap-2 text-sm">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="variant" value={variant} />
                <button name="quantity" value={quantity - 1} className="size-8 rounded-md ring-1 ring-neutral-300 hover:bg-neutral-100" aria-label="Decrease">
                  −
                </button>
                <span className="w-6 pt-1.5 text-center">{quantity}</span>
                <button name="quantity" value={quantity + 1} className="size-8 rounded-md ring-1 ring-neutral-300 hover:bg-neutral-100" aria-label="Increase">
                  +
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-2xl bg-white p-6 ring-1 ring-neutral-200">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPrice(cartTotal(lines))}</span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">Shipping and tax are not part of this demo.</p>
        <form action={placeOrder} className="mt-6 space-y-3">
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800">
            Place order
          </button>
          <p className="text-xs text-neutral-500">No payment is taken. This creates a demo order you can ask the assistant about.</p>
        </form>
      </aside>
    </div>
  );
}

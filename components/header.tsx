import Link from "next/link";

import { getCartId } from "@/lib/cart-cookie";
import { getCartCount } from "@/lib/store";

export async function Header() {
  const count = await getCartCount(await getCartId());
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Northstar Goods
        </Link>
        <form action="/search" className="hidden sm:block">
          <input
            type="search"
            name="q"
            placeholder="Search the store"
            className="w-56 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </form>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="hover:underline">
            Shop
          </Link>
          <Link href="/cart" className="hover:underline">
            Cart{count > 0 && ` (${count})`}
          </Link>
        </nav>
      </div>
    </header>
  );
}

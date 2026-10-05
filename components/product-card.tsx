import Link from "next/link";

import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/store";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200">
        <img
          src={product.image}
          alt={product.name}
          width={800}
          height={800}
          className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{product.name}</h3>
        <p className="text-sm text-neutral-600">{formatPrice(product.priceCents)}</p>
      </div>
      <p className="text-xs text-neutral-500">{product.category}</p>
    </Link>
  );
}

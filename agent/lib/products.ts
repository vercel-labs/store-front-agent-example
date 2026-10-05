import type { Product } from "../../lib/store";

// The compact shape tools return. The chat panel renders these as product cards.
export function toCard(product: Product) {
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    priceCents: product.priceCents,
    image: product.image,
    options: product.options,
  };
}

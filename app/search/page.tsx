import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { guessSearch, type RankedProduct } from "@/lib/search-intent";
import { findSimilarProducts, searchProducts, type Product } from "@/lib/store";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim() ?? "";
  if (!query) return <Empty>Type something in the search box above.</Empty>;

  // 1. Exact search: the same query the agent's search_products tool runs.
  const exact = await searchProducts({ query });
  if (exact.length > 0) return <Results heading={`Results for “${query}”`} products={exact} />;

  // 2. Nothing matched the spelling. Try products spelled close to the query.
  const similar = await findSimilarProducts(query);
  if (similar.length > 0) {
    return <Results heading={`No exact match for “${query}”. Did you mean ${similar[0].name}?`} products={similar} />;
  }

  // 3. Nothing is spelled like it either. Ask jev what the shopper meant.
  const guess = await guessSearch(query);
  if (!guess) return <Empty>Nothing in the store matches “{query}”.</Empty>;

  return (
    <Results
      heading={`Nothing is called “${query}”. ${
        guess.confidence >= 0.5
          ? `jev is ${percent(guess.confidence)} sure you are shopping for ${guess.category}.`
          : `jev's best guess is ${guess.category}, at ${percent(guess.confidence)}.`
      }`}
      products={guess.products}
    >
      <Guesses products={guess.products.slice(0, 3)} />
    </Results>
  );
}

// jev's top picks within the department, with its probability for each.
function Guesses({ products }: { products: RankedProduct[] }) {
  return (
    <p className="mt-2 flex flex-wrap gap-1 text-xs text-neutral-500">
      <span className="py-0.5">Most likely:</span>
      {products.map((p) => (
        <Link key={p.slug} href={`/products/${p.slug}`} className="rounded-full bg-neutral-100 px-2 py-0.5 hover:bg-neutral-200">
          {p.name} · {percent(p.confidence)}
        </Link>
      ))}
      <span className="rounded-full bg-neutral-100 px-2 py-0.5">typesafe-ai/jev</span>
    </p>
  );
}

function Results({ heading, products, children }: { heading: string; products: Product[]; children?: React.ReactNode }) {
  return (
    <>
      <h1 className="text-lg font-semibold">{heading}</h1>
      {children}
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-neutral-700">{children}</p>
      <Link href="/" className="text-sm underline">
        Browse everything
      </Link>
    </div>
  );
}

const percent = (n: number) => `${Math.round(n * 100)}%`;

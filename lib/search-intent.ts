import { experimental_evaluate as evaluate } from "ai";
import { getCategories, getProducts, type Product } from "./store";

// What each department sells, in the shopper's words. jev routes on these descriptions
const DEPARTMENTS: Record<string, string> = {
  Apparel: "Clothing and things you wear: jackets, vests, sweaters, shirts, tees, pants, shorts, caps, gloves, activewear, base layers.",
  Bags: "Bags and luggage: backpacks, totes, duffels, slings, hip packs, messengers, packing cubes, laptop sleeves, travel kits.",
  Accessories: "Small gear you carry: bottles, mugs, beanies, scarves, belts, socks, sunglasses, headlamps, trekking poles, wallets, keychains.",
  Home: "Things for the house and campsite: cookware, kettles, mugs, candles, lanterns, blankets, rugs, pillows, towels, planters, kitchen goods.",
};

export interface RankedProduct extends Product {
  confidence: number;
}

export interface SearchGuess {
  category: string;
  confidence: number;
  products: RankedProduct[];
}


export async function guessSearch(query: string, abortSignal?: AbortSignal): Promise<SearchGuess | null> {
  const categories = await getCategories();

  const department = await evaluate({
    abortSignal,
    model: "typesafe-ai/jev",
    state: { query },
    questions: {
      category: {
        type: "choice",
        instructions: "Which department of the store is the shopper's `query` about?",
        criteria: {
          ...Object.fromEntries(categories.map((c) => [c, DEPARTMENTS[c] ?? c])),
          none: "The query is not about anything a store like this would sell.",
        },
      },
    },
  });


  // Step 1: Take the most likely department as long as jev gives it a real chance
  const odds: Record<string, number> = department.answers.category.probabilities ?? {};
  const [category, confidence] = categories
    .map((c) => [c, odds[c] ?? 0] as const)
    .sort((a, b) => b[1] - a[1])[0];
  if (confidence < 0.2) return null; // 0.2 threshold
  const products = await getProducts(category);


  // Step 2: Rank the products within it
  const ranking = await evaluate({
    abortSignal,
    model: "typesafe-ai/jev",
    state: { query },
    questions: {
      product: {
        type: "choice",
        instructions: "Which product is the shopper's `query` most likely looking for?",
        criteria: Object.fromEntries(products.map((p) => [p.slug, `${p.name}. ${p.description}`])),
      },
    },
  });


  const probabilities = ranking.answers.product.probabilities ?? {};
  return {
    category,
    confidence,
    products: products
      .map((p) => ({ ...p, confidence: probabilities[p.slug] ?? 0 }))
      .sort((a, b) => b.confidence - a.confidence),
  };
}

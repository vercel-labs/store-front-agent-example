import { z } from "zod";

import { guessSearch } from "@/lib/search-intent";

const body = z.object({ query: z.string().trim().min(1).max(200) });

// What the search page asks jev when nothing matches by spelling, exposed for curl.
// Try: curl -X POST localhost:3000/api/search/intent -H 'content-type: application/json' -d '{"query":"athletic"}'
export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Missing "query" in request body.' }, { status: 400 });

  const guess = await guessSearch(parsed.data.query, request.signal);
  if (!guess) return Response.json({ query: parsed.data.query, guess: null });

  return Response.json({
    query: parsed.data.query,
    guess: {
      category: guess.category,
      confidence: guess.confidence,
      products: guess.products.map((p) => ({ slug: p.slug, name: p.name, confidence: p.confidence })),
    },
  });
}

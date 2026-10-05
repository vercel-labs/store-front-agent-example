import { defineTool } from "eve/tools";
import { z } from "zod";

import { getProduct } from "../../lib/store";
import { toCard } from "../lib/products";

export default defineTool({
  description: "Get one product's full details, including its description and available options, by slug.",
  inputSchema: z.object({ slug: z.string().max(100) }),
  label: { start: ({ slug }) => `Look up ${slug}` },
  async execute({ slug }) {
    const product = await getProduct(slug);
    if (!product) return { error: `No product with slug "${slug}".` };
    return { product: { ...toCard(product), description: product.description } };
  },
});

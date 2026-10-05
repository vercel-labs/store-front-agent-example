import { defineTool } from "eve/tools";
import { z } from "zod";

import { getOrder } from "../../lib/store";

export default defineTool({
  description:
    "Look up an order by its number and the email it was placed with. Both are required; never call this with a guessed email.",
  inputSchema: z.object({
    number: z.string().regex(/^\d{4,6}$/),
    email: z.string().email(),
  }),
  label: { start: ({ number }) => `Look up order ${number}` },
  async execute({ number, email }) {
    const order = await getOrder(number, email);
    if (!order) return { error: "No order matches that number and email." };
    return { order };
  },
});

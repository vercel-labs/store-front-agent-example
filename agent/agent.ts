import { defineAgent, defineDynamic } from "eve";
import { classifyIntent, intentFromMessages, recentFromHistory, type ShopperIntent } from "./lib/classify";

interface Route {
  model: string;
  fallbacks: string[];
  reasoning: "low" | "medium";
  skill: string | null;
}


// One row per intent. The type guarantees every intent has a row.
export const ROUTES: Record<ShopperIntent, Route> = {
  Personal_shopping:     { model: "google/gemini-3.5-flash-lite", fallbacks: ["anthropic/claude-haiku-4.5"],    reasoning: "low",    skill: null },
  Product_details:       { model: "openai/gpt-5.4-nano",          fallbacks: ["google/gemini-3.1-flash-lite"],  reasoning: "low",    skill: null },
  Sizing:                { model: "google/gemini-3.5-flash-lite", fallbacks: ["anthropic/claude-haiku-4.5"],    reasoning: "low",    skill: "sizing" },
  Promotions:            { model: "openai/gpt-5.4-nano",          fallbacks: ["google/gemini-3.1-flash-lite"],  reasoning: "low",    skill: "promotions" },
  Refunds_and_exchanges: { model: "openai/gpt-5.4-mini",          fallbacks: ["anthropic/claude-haiku-4.5"],    reasoning: "medium", skill: "returns-and-exchanges" },
  Technical_support:     { model: "anthropic/claude-sonnet-5",    fallbacks: ["google/gemini-3.8-flash"],       reasoning: "medium", skill: "technical-support" },
  Shipping:              { model: "openai/gpt-5.4-nano",          fallbacks: ["google/gemini-3.1-flash-lite"],  reasoning: "medium", skill: "shipping" },
};

// When no intent is known.
const DEFAULT_ROUTE = ROUTES.Personal_shopping;

export default defineAgent({
  // Picked once per turn from the shopper's intent.
  model: defineDynamic({
    events: {
      "turn.started": async (_event, ctx) => {
        let intent = intentFromMessages(ctx.messages);

        // No intent detected yet, classify with jev
        if (!intent) { 
          const recent = recentFromHistory(ctx.messages);
          const latest = recent.at(-1);

          if (latest?.role === "user") {
            const result = await classifyIntent(latest.text, recent.slice(0, -1)).catch(() => undefined);
            intent = result?.intent;
          }
        }


        const route = intent ? ROUTES[intent] : DEFAULT_ROUTE;
        return {
          model: route.model,
          reasoning: route.reasoning,
          modelOptions: { providerOptions: { gateway: { models: route.fallbacks } } },
        };

      },
    },
  }),

  
  defaultTools: false, // Only the tools in agent/tools/.
  tool: false, // No spawning copies of itself.
});

"use client";

import type { EveDynamicToolPart, EveMessage } from "eve/react";
import { useEveAgent } from "eve/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { formatPrice } from "@/lib/format";

interface ProductCardData {
  slug: string;
  name: string;
  priceCents: number;
  image: string;
}

// What the panel learned about each turn: the classifier and the intent it chose
// before the send, the routing note to pass to the agent, and the model Eve
// selected once the turn started.
interface TurnInfo {
  classifier?: string;
  intent?: string;
  confidence?: number;
  note?: string;
  modelId?: string;
}

export function Chat() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<TurnInfo[]>([]);
  const router = useRouter();
  const cartReady = useRef<Promise<unknown> | null>(null);
  const pendingIntent = useRef<TurnInfo | null>(null);
  const seenTurnIds = useRef(new Set<string>());

  const agent = useEveAgent({
    async prepareSend(turn) {
      // Make sure the browser has a cart cookie before the first message, so the
      // agent's channel can bind the session to that cart.
      cartReady.current ??= fetch("/api/agent/session", { method: "POST" });
      await cartReady.current;
      const detected = pendingIntent.current;
      pendingIntent.current = null;
      // The routing note travels with the message as turn context. Eve delivers it to the
      // model as a user message; the agent's model resolver reads the intent out of it.
      return { ...turn, clientContext: detected?.note };
    },
    onEvent(event) {
      // The first model step of each turn reports which model the router picked.
      if (event.type === "step.started" && !seenTurnIds.current.has(event.data.turnId)) {
        seenTurnIds.current.add(event.data.turnId);
        const modelId = event.data.modelId;
        setTurns((all) => all.map((t, i) => (i === all.length - 1 ? { ...t, modelId } : t)));
      }
    },
    // The agent may have changed the cart; refresh server components so the
    // header count and cart page reflect it.
    onFinish: () => router.refresh(),
  });

  const busy = agent.status === "submitted" || agent.status === "streaming";
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [agent.data.messages]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    // Classify first (bounded), so the badge and the routing use the same answer.
    // Recent messages let a short follow-up keep the topic of the conversation.
    const detected = await classify(text, recentFrom(agent.data.messages));
    pendingIntent.current = detected;
    setTurns((all) => [...all, detected]);
    void agent.send(text);
  }

  function reset() {
    agent.reset();
    setTurns([]);
    seenTurnIds.current.clear();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-neutral-800"
      >
        Ask the store
      </button>
    );
  }

  // An assistant message shares the turn info of the user message that triggered it.
  let turnIndex = -1;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex h-[75vh] flex-col rounded-t-2xl bg-white shadow-2xl ring-1 ring-neutral-200 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:h-[600px] sm:w-[400px] sm:rounded-2xl">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Northstar assistant</p>
          <p className="text-xs text-neutral-500">Products, sizing, orders, and your cart</p>
        </div>
        <div className="flex gap-3 text-xs text-neutral-500">
          <button type="button" onClick={reset} className="hover:text-neutral-900">
            New chat
          </button>
          <button type="button" onClick={() => setOpen(false)} className="hover:text-neutral-900">
            Close
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {agent.data.messages.length === 0 && (
          <p className="text-sm text-neutral-500">
            Try “a jacket under $150”, “does the fleece run small?”, or “add the wool beanie to my cart”.
          </p>
        )}
        {agent.data.messages.map((message) => {
          if (message.role === "user") turnIndex++;
          return <Message key={message.id} message={message} info={turns[turnIndex]} />;
        })}
        {agent.error && <p className="text-xs text-red-600">{agent.error.message}</p>}
        <div ref={bottom} />
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-neutral-200 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={busy ? "Thinking…" : "Ask about products, sizing, or your order"}
          disabled={busy}
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}

type RecentMessage = { role: "user" | "assistant"; text: string };

// The last few exchanges as plain text, for the classifier.
function recentFrom(messages: readonly EveMessage[], limit = 4): RecentMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as RecentMessage["role"],
      text: m.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim(),
    }))
    .filter((m) => m.text)
    .slice(-limit);
}

// Ask the server to classify the message with jev. Bounded so a slow classifier
// never delays the shopper; without an answer the agent classifies for itself.
async function classify(message: string, recent: RecentMessage[]): Promise<TurnInfo> {
  try {
    const response = await fetch("/api/agent/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, recent }),
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return {};
    const data = (await response.json()) as TurnInfo;
    return { classifier: data.classifier, intent: data.intent, confidence: data.confidence, note: data.note };
  } catch {
    return {};
  }
}

function Message({ message, info }: { message: EveMessage; info?: TurnInfo }) {
  if (message.role !== "user") return <AssistantMessage message={message} info={info} />;
  return (
    <div className="flex flex-col items-end gap-1">
      {message.parts.map((part, index) =>
        part.type === "text" && part.text ? (
          <p key={index} className="max-w-[85%] rounded-2xl bg-neutral-900 px-3 py-2 text-sm text-white">
            {part.text}
          </p>
        ) : null,
      )}
      {info && <IntentChips info={info} />}
    </div>
  );
}

function AssistantMessage({ message, info }: { message: EveMessage; info?: TurnInfo }) {
  // Several tools in one reply can return the same product; show each card once.
  // Computed up front so rendering stays free of side effects.
  const shown = new Set<string>();
  const cardsByCall = new Map<string, ProductCardData[]>();
  let skill = "";
  for (const part of message.parts) {
    if (part.type !== "dynamic-tool") continue;
    if (isSkillPart(part) && part.state !== "output-error") skill ||= skillName(part.input);
    const fresh = productsFrom(part).filter((p) => !shown.has(p.slug));
    fresh.forEach((p) => shown.add(p.slug));
    cardsByCall.set(part.toolCallId, fresh);
  }
  return (
    <div className="space-y-2">
      {info?.intent && <Narration intent={info.intent} skill={skill} />}
      <RouteRow skill={skill} modelId={info?.modelId} />
      {message.parts.map((part, index) => {
        if (part.type === "text")
          return part.text ? (
            <p key={index} className="text-sm leading-relaxed text-neutral-800">
              {part.text}
            </p>
          ) : null;
        // Skill loads are reported once in RouteRow above.
        if (part.type === "dynamic-tool" && !isSkillPart(part))
          return <ToolPart key={part.toolCallId} part={part} products={cardsByCall.get(part.toolCallId) ?? []} />;
        return null;
      })}
    </div>
  );
}

// Half the demo: which model classified the message, and what it decided.
function IntentChips({ info }: { info: TurnInfo }) {
  if (!info.intent) return null;
  return (
    <p className="flex flex-wrap justify-end gap-1 text-[11px] text-neutral-500">
      <span className="rounded-full bg-neutral-100 px-2 py-0.5">
        {info.intent.replaceAll("_", " ")}
        {info.confidence !== undefined && ` · ${Math.round(info.confidence * 100)}%`}
      </span>
      {info.classifier && <span className="rounded-full bg-neutral-100 px-2 py-0.5">{info.classifier}</span>}
    </p>
  );
}

// The other half: what that decision selected — a skill to load and a model to answer.
function RouteRow({ skill, modelId }: { skill: string; modelId?: string }) {
  if (!skill && !modelId) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400">
      {skill && <span>Loading skill: {skill}</span>}
      {modelId && (
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
          Model to be used: {modelId}
        </span>
      )}
    </p>
  );
}

// Names the skill when one loaded, so this line cannot contradict the row above it
// on the turns where the model picks a skill the intent did not route to.
function Narration({ intent, skill }: { intent: string; skill: string }) {
  const topic = skill ? skill.replaceAll("-", " ") : intent.replaceAll("_", " ").toLowerCase();
  const text = `It looks like you're looking for ${topic.endsWith("support") ? topic : `${topic} support`}.${
    skill ? " Let me gather the right skills to help…" : ""
  }`;
  return (
    <p className="text-sm text-neutral-500 italic">
      <Typewriter text={text} />
    </p>
  );
}

// Keyed on the text so streaming re-renders do not restart the animation.
function Typewriter({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= text.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [text]);
  return <>{text.slice(0, shown)}</>;
}

function ToolPart({ part, products }: { part: EveDynamicToolPart; products: ProductCardData[] }) {
  if (products.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {products.map((p) => (
          <Link key={p.slug} href={`/products/${p.slug}`} className="rounded-lg ring-1 ring-neutral-200 hover:bg-neutral-50">
            <img src={p.image} alt="" className="aspect-square w-full rounded-t-lg" />
            <div className="p-2">
              <p className="truncate text-xs font-medium">{p.name}</p>
              <p className="text-xs text-neutral-500">{formatPrice(p.priceCents)}</p>
            </div>
          </Link>
        ))}
      </div>
    );
  }
  // A product tool whose results were all shown already needs no status line.
  if (productsFrom(part).length > 0) return null;
  const name = part.toolName.replaceAll("_", " ");
  return (
    <p className="text-xs text-neutral-400">
      Using skill: {name.charAt(0).toUpperCase() + name.slice(1)}
      {part.state === "output-error" && " (failed)"}
    </p>
  );
}

function isSkillPart(part: EveDynamicToolPart): boolean {
  return part.toolName === "load_skill" || part.toolMetadata?.eve?.kind === "load-skill";
}

function productsFrom(part: EveDynamicToolPart): ProductCardData[] {
  if (part.state !== "output-available" || !part.output || typeof part.output !== "object") return [];
  const output = part.output as { products?: ProductCardData[]; product?: ProductCardData };
  return output.products ?? (output.product ? [output.product] : []);
}

function skillName(input: unknown): string {
  if (input && typeof input === "object") {
    const value = Object.values(input as Record<string, unknown>)[0];
    if (typeof value === "string") return value;
  }
  return "";
}

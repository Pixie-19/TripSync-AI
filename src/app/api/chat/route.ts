import { NextResponse } from "next/server";
import { callMistralChat } from "@/lib/ai";
import { checkRateLimit, isTravelRelated } from "@/lib/rateLimit";

const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4000;

// Strip anything the client sends except user/assistant turns with string
// content; truncate per-message and total count. Without this filter a
// caller can send `{role: "system", content: "..."}` to override the server
// prompt — supabase the model with their own instructions.
function sanitizeMessages(raw: unknown): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = (m as any).role;
    const content = (m as any).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string" || content.length === 0) continue;
    cleaned.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
  }
  return cleaned.slice(-MAX_MESSAGES);
}

// Allowlist + cap fields before they're JSON.stringify'd into the system
// prompt. A trip title set to "\"]\nIgnore prior" can't easily break out of
// the JSON envelope (escapes save us), but unbounded user-controlled strings
// can still steer the model. Limit to fields the assistant actually needs.
function sanitizeTripContext(ctx: unknown): Record<string, string | number> | null {
  if (!ctx || typeof ctx !== "object") return null;
  const c = ctx as Record<string, unknown>;
  const cap = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return {
    title: cap(c.title, 200),
    destination: cap(c.destination, 200),
    budget: num(c.budget),
    currency: cap(c.currency, 10),
    num_people: num(c.num_people),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ data: null, error: "Messages array is required" }, { status: 400 });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ data: null, error: "AI service not configured" }, { status: 500 });
    }

    const messages = sanitizeMessages(body.messages);
    if (messages.length === 0) {
      return NextResponse.json({ data: null, error: "No valid messages" }, { status: 400 });
    }

    // ─── Rate Limiting ────────────────────────────────────────────────────────
    const userId = body.userId || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateCheck = checkRateLimit(userId);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { data: null, error: rateCheck.reason, rateLimited: true, remaining: rateCheck.remaining },
        { status: 429 }
      );
    }

    // ─── AI Guardrail ─────────────────────────────────────────────────────────
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage && !isTravelRelated(lastUserMessage.content)) {
      return NextResponse.json(
        {
          data: "I can only help with travel and expense-related queries. Try asking about your trip destination, budget tips, or what to pack!",
          error: null,
        },
        { status: 200 }
      );
    }

    // ─── System Prompt ────────────────────────────────────────────────────────
    const cleanContext = sanitizeTripContext(body.tripContext);
    const systemPrompt = `You are TripBot, an expert AI travel assistant embedded in TripSync AI, a group travel planning app.
Context: ${cleanContext ? JSON.stringify(cleanContext) : "No trip selected"}

You ONLY answer questions about: travel planning, destinations, budgets, expenses, food, packing, local tips, weather, and trip logistics.
If asked about anything unrelated, politely redirect to travel topics.

FORMATTING RULES:
- No markdown characters (no **, no #, no backticks).
- No dollar signs. Use INR or local currency names.
- Use plain text and emojis only.
- For lists, use hyphens (-) or numbers.`;

    const response = await callMistralChat(messages, systemPrompt);
    return NextResponse.json({
      data: response,
      error: null,
      remaining: rateCheck.remaining,
    });

  } catch (error: any) {
    console.error("Chat API Error:", error.message);
    return NextResponse.json({ data: null, error: error.message || "Chat failed" }, { status: 500 });
  }
}

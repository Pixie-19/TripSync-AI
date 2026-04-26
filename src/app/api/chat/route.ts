import { NextResponse } from "next/server";
import { callMistralChat } from "@/lib/ai";
import { checkRateLimit, isTravelRelated } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ data: null, error: "Messages array is required" }, { status: 400 });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ data: null, error: "AI service not configured" }, { status: 500 });
    }

    // ─── Rate Limiting ────────────────────────────────────────────────────────
    const userId = body.userId || request.headers.get("x-forwarded-for") || "anonymous";
    const rateCheck = checkRateLimit(userId);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { data: null, error: rateCheck.reason, rateLimited: true, remaining: rateCheck.remaining },
        { status: 429 }
      );
    }

    // ─── AI Guardrail ─────────────────────────────────────────────────────────
    const lastUserMessage = [...body.messages].reverse().find((m: any) => m.role === "user");
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
    const systemPrompt = `You are TripBot, an expert AI travel assistant embedded in TripSync AI, a group travel planning app.
Context: ${body.tripContext ? JSON.stringify(body.tripContext) : "No trip selected"}

You ONLY answer questions about: travel planning, destinations, budgets, expenses, food, packing, local tips, weather, and trip logistics.
If asked about anything unrelated, politely redirect to travel topics.

FORMATTING RULES:
- No markdown characters (no **, no #, no backticks).
- No dollar signs. Use INR or local currency names.
- Use plain text and emojis only.
- For lists, use hyphens (-) or numbers.`;

    const response = await callMistralChat(body.messages, systemPrompt);
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

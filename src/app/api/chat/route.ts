import { NextResponse } from "next/server";
import { callMistralChat } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ data: null, error: "Messages array is required" }, { status: 400 });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ data: null, error: "AI service not configured" }, { status: 500 });
    }

    const systemPrompt = `You are TripBot, an expert AI travel assistant embedded in TripSync AI — a group travel planning app.
Context: ${body.tripContext ? JSON.stringify(body.tripContext) : "No trip selected"}

Help with: restaurant recommendations, activity suggestions, budget tips, packing lists, local customs, weather advice, travel hacks.
Keep responses concise, friendly, and actionable. Use emojis tastefully. 

CRITICAL FORMATTING RULES:
- DO NOT use any markdown characters: No asterisks (**), no hashes (#), no backticks (\`).
- DO NOT use dollar signs ($). Use currency codes like INR or local names.
- Use plain text and emojis ONLY.
- For lists, use simple hyphens (-) or numbers.`;

    const response = await callMistralChat(body.messages, systemPrompt);
    return NextResponse.json({ data: response, error: null });

  } catch (error: any) {
    console.error("Chat API Error:", error.message);
    return NextResponse.json({ data: null, error: error.message || "Chat failed" }, { status: 500 });
  }
}

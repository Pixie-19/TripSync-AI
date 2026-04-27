import { NextResponse } from "next/server";
import { generateBudgetInsights } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ data: null, error: "Invalid request body" }, { status: 400 });
    }

    const { totalBudget, totalSpent, categoryBreakdown, numDaysLeft, destination } = body;

    if (totalBudget === undefined || totalSpent === undefined) {
      return NextResponse.json({ data: null, error: "Missing required budget fields" }, { status: 400 });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json(
        { data: null, error: "AI service configuration missing." },
        { status: 500 }
      );
    }

    // Rate-limit so a misbehaving (or unauth'd) client can't burn the
    // Mistral quota by hammering this endpoint. Same scheme as /api/chat.
    const rateKey = body.userId || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateCheck = checkRateLimit(rateKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { data: null, error: rateCheck.reason, rateLimited: true, remaining: rateCheck.remaining },
        { status: 429 }
      );
    }

    const insights = await generateBudgetInsights({
      totalBudget: Number(totalBudget),
      totalSpent: Number(totalSpent),
      categoryBreakdown: categoryBreakdown ?? {},
      numDaysLeft: Number(numDaysLeft) ?? 0,
      destination: destination ?? "your destination",
    });

    return NextResponse.json({ data: insights, error: null });

  } catch (error: any) {
    console.error("Budget Insights Error:", error.message);
    
    let statusCode = 500;
    let message = error.message || "Failed to generate insights";

    if (message.includes("quota")) {
      statusCode = 429;
      message = "AI service quota exceeded. Please try again later.";
    }

    return NextResponse.json(
      { data: null, error: message },
      { status: statusCode }
    );
  }
}

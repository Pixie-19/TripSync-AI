import { NextResponse } from "next/server";
import { generateItinerary } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    // 1. Parse and validate body
    const body = await request.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json({ data: null, error: "Invalid request body" }, { status: 400 });
    }

    const { destination, budget, duration } = body;

    if (!destination || !budget || !duration) {
      return NextResponse.json(
        { data: null, error: "Missing required fields: destination, budget, and duration are mandatory." },
        { status: 400 }
      );
    }

    // 2. Check API configuration
    if (!process.env.MISTRAL_API_KEY) {
      console.error("MISTRAL_API_KEY is missing");
      return NextResponse.json(
        { data: null, error: "AI service is not configured." },
        { status: 500 }
      );
    }

    // 3. Generate the itinerary using Gemini 2.0 Flash
    const itinerary = await generateItinerary({
      destination,
      budget: Number(budget),
      duration: Number(duration),
      preferences: body.preferences ?? [],
      numPeople: Number(body.numPeople) ?? 2,
      currency: body.currency ?? "INR",
    });

    // 4. Return clean JSON response with 'data' wrapper
    return NextResponse.json({ data: itinerary, error: null }, { status: 200 });

  } catch (error: any) {
    console.error("API Error [generate-itinerary]:", error.message);

    // 5. Categorize error for better client feedback
    let statusCode = 500;
    let message = error.message || "An unexpected error occurred.";

    if (message.includes("API_KEY_INVALID")) {
      statusCode = 401;
      message = "Invalid Gemini API Key.";
    } else if (message.includes("quota")) {
      statusCode = 429;
      message = "AI service quota exceeded. Please try again later.";
    }

    return NextResponse.json(
      { data: null, error: message },
      { status: statusCode }
    );
  }
}

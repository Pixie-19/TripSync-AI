const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

async function callMistral(prompt: string): Promise<string> {
  try {
    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" }
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Mistral API Error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (error: any) {
    console.error("Mistral Provider Error:", error);
    throw new Error(`AI Service Error: ${error.message}`);
  }
}

// ─── ITINERARY GENERATION ────────────────────────────────────────────────────

export interface ItineraryActivity {
  title: string;
  description: string;
  location: string;
  duration: string;
  cost: number;
  category: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  morning: ItineraryActivity;
  afternoon: ItineraryActivity;
  evening: ItineraryActivity;
  estimatedCost: number;
  tips: string[];
}

export interface GeneratedItinerary {
  summary: string;
  highlights: string[];
  days: ItineraryDay[];
  budgetBreakdown: {
    accommodation: number;
    food: number;
    transport: number;
    activities: number;
    miscellaneous: number;
  };
  tips: string[];
  totalEstimatedCost: number;
}

export async function generateItinerary(params: {
  destination: string;
  budget: number;
  duration: number;
  preferences: string[];
  numPeople: number;
  currency?: string;
}): Promise<GeneratedItinerary> {
  const { destination, budget, duration, preferences, numPeople, currency = "INR" } = params;
  const prefStr = preferences.length > 0 ? preferences.join(", ") : "balanced";

  const prompt = `
You are an expert travel planner. Generate a detailed ${duration}-day trip itinerary to ${destination} for ${numPeople} people with a total budget of ${currency} ${budget}.
Preferences: ${prefStr}

Return a valid JSON object in this format:
{
  "summary": "overview",
  "highlights": ["h1", "h2"],
  "days": [
    {
      "day": 1,
      "date": "Day 1",
      "theme": "Arrival",
      "morning": { "title": "A", "description": "D", "location": "L", "duration": "2h", "cost": 100, "category": "food" },
      "afternoon": { "title": "...", "description": "...", "location": "...", "duration": "...", "cost": 0, "category": "..." },
      "evening": { "title": "...", "description": "...", "location": "...", "duration": "...", "cost": 0, "category": "..." },
      "estimatedCost": 100,
      "tips": ["t1"]
    }
  ],
  "budgetBreakdown": { "accommodation": 100, "food": 50, "transport": 20, "activities": 20, "miscellaneous": 10 },
  "tips": ["tip1"],
  "totalEstimatedCost": 100
}

Ensure all costs are numbers. All costs in ${currency}.`;

  const raw = await callMistral(prompt);
  
  try {
    return JSON.parse(raw) as GeneratedItinerary;
  } catch (e) {
    console.error("Mistral JSON Parse Error:", e, "Raw:", raw);
    throw new Error("AI returned an invalid format. Please try again.");
  }
}

// ─── BUDGET INSIGHTS ─────────────────────────────────────────────────────────

export interface BudgetInsight {
  type: "warning" | "success" | "tip" | "info";
  title: string;
  message: string;
  icon: string;
}

export async function generateBudgetInsights(params: {
  totalBudget: number;
  totalSpent: number;
  categoryBreakdown: Record<string, number>;
  numDaysLeft: number;
  destination: string;
}): Promise<BudgetInsight[]> {
  const { totalBudget, totalSpent, categoryBreakdown, numDaysLeft, destination } = params;
  
  const prompt = `
Advisor for trip to ${destination}.
Budget: ₹${totalBudget}, Spent: ₹${totalSpent}, Days left: ${numDaysLeft}.
Categories: ${JSON.stringify(categoryBreakdown)}

Return a valid JSON array of 4-6 insights:
[
  { "type": "warning|success|tip|info", "title": "T", "message": "M", "icon": "E" }
]`;

  const raw = await callMistral(prompt);

  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : data.insights || [];
  } catch {
    return [{
      type: "info",
      title: "Budget Status",
      message: `You have spent ₹${totalSpent} out of ₹${totalBudget}.`,
      icon: "💰"
    }];
  }
}

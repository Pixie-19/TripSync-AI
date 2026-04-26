// In-memory rate limiting store (resets on server restart – sufficient for MVP/hackathon)
// For production, use Redis or Upstash

interface RateLimitEntry {
  minute: { count: number; resetAt: number };
  day: { count: number; resetAt: number };
}

const store = new Map<string, RateLimitEntry>();

const LIMITS = {
  perMinute: 5,
  perDay: 50,
};

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  remaining: { minute: number; day: number };
}

export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const minuteReset = now + 60_000;
  const dayReset = now + 86_400_000;

  let entry = store.get(userId);

  if (!entry) {
    entry = {
      minute: { count: 0, resetAt: minuteReset },
      day: { count: 0, resetAt: dayReset },
    };
  }

  // Reset counters if windows have expired
  if (now > entry.minute.resetAt) {
    entry.minute = { count: 0, resetAt: minuteReset };
  }
  if (now > entry.day.resetAt) {
    entry.day = { count: 0, resetAt: dayReset };
  }

  // Check limits BEFORE incrementing
  if (entry.day.count >= LIMITS.perDay) {
    store.set(userId, entry);
    return {
      allowed: false,
      reason: "Daily AI limit reached (50 requests). Resets at midnight.",
      remaining: { minute: Math.max(0, LIMITS.perMinute - entry.minute.count), day: 0 },
    };
  }

  if (entry.minute.count >= LIMITS.perMinute) {
    store.set(userId, entry);
    return {
      allowed: false,
      reason: "Too many requests. Please wait a minute before trying again.",
      remaining: { minute: 0, day: Math.max(0, LIMITS.perDay - entry.day.count) },
    };
  }

  // Increment
  entry.minute.count++;
  entry.day.count++;
  store.set(userId, entry);

  return {
    allowed: true,
    remaining: {
      minute: LIMITS.perMinute - entry.minute.count,
      day: LIMITS.perDay - entry.day.count,
    },
  };
}

// Travel guardrail – keyword-based fast-path check
const TRAVEL_KEYWORDS = [
  "trip", "travel", "hotel", "flight", "food", "restaurant", "expense", "budget",
  "spend", "cost", "money", "pay", "split", "settle", "itinerary", "destination",
  "plan", "visit", "tour", "transport", "taxi", "train", "bus", "stay", "activity",
  "activities", "pack", "luggage", "visa", "currency", "weather", "map", "place",
  "attraction", "beach", "mountain", "city", "country", "goa", "delhi", "mumbai",
  "india", "abroad", "international", "domestic", "booking", "ticket", "check-in",
];

const OFF_TOPIC_PATTERNS = [
  /\b(code|programming|python|javascript|java|sql|algorithm|debug|software|hack)\b/i,
  /\b(politics|election|war|religion|philosophy|math problem|homework)\b/i,
  /\b(stock|crypto|bitcoin|trading|investment portfolio)\b/i,
];

export function isTravelRelated(query: string): boolean {
  const lower = query.toLowerCase();

  // If it matches obvious off-topic patterns, reject
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(lower)) return false;
  }

  // If contains travel keywords, allow
  for (const kw of TRAVEL_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }

  // Short greetings are fine ("hello", "hi", "thanks")
  if (query.trim().split(/\s+/).length <= 4) return true;

  // Default: allow (LLM system prompt will handle the rest)
  return true;
}

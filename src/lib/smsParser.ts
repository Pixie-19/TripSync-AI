// UPI / SMS Transaction Parser
// Parses common UPI, bank SMS, and notification formats

export interface ParsedTransaction {
  amount: number;
  merchant: string;
  type: "debit" | "credit";
  rawText: string;
  suggestedCategory: string;
  suggestedTitle: string;
}

// Amount patterns
const AMOUNT_PATTERNS = [
  /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹)/i,
  /(?:debited|credited|paid|received|transferred)\s+(?:by\s+)?(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /(?:amount\s+of\s+)(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
];

// Merchant patterns
const MERCHANT_PATTERNS = [
  /(?:paid\s+to|to\s+VPA|at|to)\s+([A-Za-z0-9\s@._-]+?)(?:\s+via|\s+on|\s+ref|\s+upi|\.|$)/i,
  /(?:from|by)\s+([A-Za-z0-9\s@._-]+?)(?:\s+via|\s+on|\s+ref|\s+upi|\.|$)/i,
  /(?:UPI\s+ID:\s*)([A-Za-z0-9@._-]+)/i,
  /VPA\s+([A-Za-z0-9@._-]+)/i,
];

const DEBIT_KEYWORDS = ["debited", "paid", "sent", "transferred", "deducted", "withdrawn", "payment of"];
const CREDIT_KEYWORDS = ["credited", "received", "deposited", "refund", "cashback", "added"];

function parseAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const cleaned = match[1].replace(/,/g, "");
      const amount = parseFloat(cleaned);
      if (!isNaN(amount) && amount > 0) return amount;
    }
  }
  return null;
}

function parseMerchant(text: string): string {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/@\w+$/, "").trim();
    }
  }
  // Fallback: extract any capitalized words or known apps
  const apps = ["Zomato", "Swiggy", "Uber", "Ola", "Amazon", "Flipkart", "IRCTC", "MakeMyTrip", "PhonePe", "GPay", "Paytm", "NEFT", "IMPS"];
  for (const app of apps) {
    if (new RegExp(app, "i").test(text)) return app;
  }
  return "Unknown Merchant";
}

function detectType(text: string): "debit" | "credit" {
  const lower = text.toLowerCase();
  for (const kw of CREDIT_KEYWORDS) {
    if (lower.includes(kw)) return "credit";
  }
  return "debit"; // Default assumption for UPI payments
}

function suggestCategory(merchant: string, text: string): string {
  const combined = (merchant + " " + text).toLowerCase();
  if (/zomato|swiggy|food|restaurant|cafe|eat|lunch|dinner|breakfast|meal|pizza|burger|biryani/.test(combined)) return "food";
  if (/uber|ola|rapido|taxi|auto|bus|train|flight|railway|metro|rickshaw|irctc|makemytrip/.test(combined)) return "transport";
  if (/hotel|hostel|airbnb|stay|room|lodge|resort|oyo/.test(combined)) return "stay";
  if (/movie|museum|park|adventure|trek|hike|tour|ticket|entry|show|pvr|inox/.test(combined)) return "activities";
  if (/shop|mart|mall|amazon|flipkart|buy|purchase|market/.test(combined)) return "shopping";
  return "other";
}

export function parseSMSTransaction(text: string): ParsedTransaction | null {
  if (!text || text.trim().length < 5) return null;

  const amount = parseAmount(text);
  if (!amount) return null; // No amount = not a transaction

  const merchant = parseMerchant(text);
  const type = detectType(text);
  const category = suggestCategory(merchant, text);

  const title = type === "debit"
    ? `${merchant !== "Unknown Merchant" ? merchant : "Expense"}`
    : `Received from ${merchant}`;

  return {
    amount,
    merchant,
    type,
    rawText: text,
    suggestedCategory: category,
    suggestedTitle: title,
  };
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export function getDaysCount(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = e.getTime() - s.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function autoCategorize(
  title: string
): "food" | "transport" | "stay" | "activities" | "shopping" | "other" {
  const t = title.toLowerCase();
  if (/uber|ola|rapido|taxi|auto|bus|train|flight|railway|metro|rickshaw/.test(t))
    return "transport";
  if (/zomato|swiggy|food|restaurant|cafe|eat|lunch|dinner|breakfast|meal|pizza|burger/.test(t))
    return "food";
  if (/hotel|hostel|airbnb|stay|room|lodge|resort|oyo/.test(t))
    return "stay";
  if (/movie|museum|park|adventure|trek|hike|tour|ticket|entry|show/.test(t))
    return "activities";
  if (/shop|mart|mall|amazon|flipkart|buy|purchase|market/.test(t))
    return "shopping";
  return "other";
}

/**
 * Settlement algorithm – minimizes the number of transactions.
 * Given a map of userId -> net balance (positive = owed, negative = owes),
 * returns an array of { from, to, amount } transactions.
 */
export function calculateSettlements(
  balances: Record<string, number>
): { from: string; to: string; amount: number }[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  Object.entries(balances).forEach(([id, bal]) => {
    if (bal > 0.01) creditors.push({ id, amount: bal });
    else if (bal < -0.01) debtors.push({ id, amount: -bal });
  });

  const result: { from: string; to: string; amount: number }[] = [];

  let i = 0,
    j = 0;
  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i];
    const debt = debtors[j];
    const pay = Math.min(credit.amount, debt.amount);

    result.push({ from: debt.id, to: credit.id, amount: Math.round(pay * 100) / 100 });

    credit.amount -= pay;
    debt.amount -= pay;

    if (credit.amount < 0.01) i++;
    if (debt.amount < 0.01) j++;
  }

  return result;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    food: "🍽️",
    transport: "🚗",
    stay: "🏨",
    activities: "🎯",
    shopping: "🛍️",
    other: "💰",
  };
  return icons[category] ?? "💰";
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    food: "text-amber-400 bg-amber-400/10",
    transport: "text-brand-400 bg-brand-400/10",
    stay: "text-violet-400 bg-violet-400/10",
    activities: "text-emerald-400 bg-emerald-400/10",
    shopping: "text-rose-400 bg-rose-400/10",
    other: "text-slate-400 bg-slate-400/10",
  };
  return colors[category] ?? "text-slate-400 bg-slate-400/10";
}

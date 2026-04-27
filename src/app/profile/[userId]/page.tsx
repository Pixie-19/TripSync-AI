"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  TrendingUp,
  TrendingDown,
  Loader2,
  ReceiptText,
  Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, getCategoryIcon } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
  trip_id: string;
  trip_title?: string;
}

export default function FriendProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalOwed, setTotalOwed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sharedTrips, setSharedTrips] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userData) setProfile(userData);

    const { data: paidExpenses } = await supabase
      .from("expenses")
      .select("*, trips(title)")
      .eq("paid_by", userId)
      .order("created_at", { ascending: false });

    const paid = paidExpenses ?? [];
    setExpenses(paid.map((e: any) => ({ ...e, trip_title: e.trips?.title })));
    setTotalPaid(paid.reduce((s: number, e: any) => s + e.amount, 0));

    const { data: splitExpenses } = await supabase
      .from("expenses")
      .select("amount, split_among")
      .contains("split_among", [userId]);

    const owed = (splitExpenses ?? []).reduce((s: number, e: any) => {
      return s + e.amount / (e.split_among?.length || 1);
    }, 0);
    setTotalOwed(owed);

    const { data: trips } = await supabase
      .from("trip_members")
      .select("trip_id, trips(title, destination)")
      .eq("user_id", userId);

    setSharedTrips(trips?.map((t: any) => t.trips).filter(Boolean) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.replace("/auth");
      return;
    }
    fetchData();
  }, [authLoading, currentUser, router, fetchData]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  const netBalance = totalPaid - totalOwed;
  const isPositive = netBalance >= 0;

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main className="min-h-screen bg-canvas">
      <nav className="sticky top-0 z-40 bg-veil border-b border-subtle backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-icon" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-display text-base text-ink truncate" style={{ fontWeight: 500 }}>
            {profile?.full_name ?? profile?.email ?? "Traveler profile"}
          </span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-12 pb-20 grid lg:grid-cols-12 gap-10">
        {/* Left — Identity */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="flex items-start gap-5">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="avatar w-20 h-20 text-3xl flex-shrink-0 rounded-md">
                  {(profile?.full_name ?? profile?.email ?? "?")[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1
                  className="font-display text-2xl text-ink"
                  style={{ fontWeight: 500, letterSpacing: "-0.015em", fontVariationSettings: "'opsz' 144" }}
                >
                  {profile?.full_name ?? "Traveler"}
                </h1>
                <div className="flex items-center gap-1.5 text-sm text-ink-muted mt-1">
                  <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span className="truncate">{profile?.email}</span>
                </div>
                <span className="badge mt-3">
                  {sharedTrips.length} shared {sharedTrips.length === 1 ? "trip" : "trips"}
                </span>
              </div>
            </div>

            {/* Financial summary */}
            <div className="space-y-px bg-default rounded-lg overflow-hidden border border-subtle">
              <FinanceCell
                label="Total paid"
                value={formatCurrency(totalPaid)}
              />
              <FinanceCell
                label="Total share"
                value={formatCurrency(totalOwed)}
                tone="muted"
              />
              <FinanceCell
                label="Net balance"
                value={`${isPositive ? "+" : ""}${formatCurrency(netBalance)}`}
                tone={isPositive ? "success" : "danger"}
                caption={isPositive ? "Gets back" : "Owes"}
                icon={isPositive ? TrendingUp : TrendingDown}
              />
            </div>

            {/* Spending by category */}
            {Object.keys(categoryTotals).length > 0 && (
              <div>
                <div className="eyebrow mb-3">Spending</div>
                <ul className="space-y-1.5">
                  {Object.entries(categoryTotals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, total]) => {
                      const Icon = getCategoryIcon(cat);
                      return (
                        <li
                          key={cat}
                          className="flex items-center gap-2.5 py-1.5 text-sm"
                        >
                          <Icon className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
                          <span className="text-ink-secondary capitalize flex-1">{cat}</span>
                          <span className="numeric-display tnum text-ink">
                            {formatCurrency(total)}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </div>
        </aside>

        {/* Right — History */}
        <section className="lg:col-span-7">
          <div className="eyebrow-rule mb-4">Expense history</div>
          <h2
            className="font-display text-3xl text-ink mb-6"
            style={{ fontWeight: 400, letterSpacing: "-0.015em", fontVariationSettings: "'opsz' 144" }}
          >
            What they&apos;ve picked up.
          </h2>

          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <ReceiptText className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <p className="empty-state__caption">No expenses recorded yet.</p>
            </div>
          ) : (
            <>
              <ul className="rounded-lg border border-subtle overflow-hidden divide-y divide-[color:var(--border-subtle)]">
                {expenses.slice(0, 12).map((expense) => {
                  const Icon = getCategoryIcon(expense.category);
                  return (
                    <li key={expense.id}>
                      <button
                        onClick={() => router.push(`/trips/${expense.trip_id}`)}
                        className="w-full text-left bg-elevated hover:bg-overlay px-4 py-3.5 transition-colors flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-md bg-tint flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-ink-secondary" strokeWidth={1.75} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-ink truncate font-medium">
                            {expense.title}
                          </div>
                          <div className="text-[11px] text-ink-muted truncate mt-0.5 flex items-center gap-1.5">
                            {expense.trip_title && (
                              <>
                                <span className="text-accent">{expense.trip_title}</span>
                                <span className="text-ink-faint">·</span>
                              </>
                            )}
                            <Calendar className="w-3 h-3" strokeWidth={1.75} />
                            <span>{format(new Date(expense.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div className="numeric-display tnum text-sm text-ink flex-shrink-0">
                          {formatCurrency(expense.amount)}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {expenses.length > 12 && (
                <p className="text-center text-[11px] text-ink-faint mt-3">
                  Showing 12 of {expenses.length} expenses
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function FinanceCell({
  label,
  value,
  caption,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: "success" | "danger" | "muted";
  icon?: any;
}) {
  const valueColor =
    tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : tone === "muted" ? "text-ink-secondary" : "text-ink";
  return (
    <div className="bg-elevated px-5 py-3.5 flex items-center justify-between">
      <span className="eyebrow">{label}</span>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={`w-3.5 h-3.5 ${valueColor}`} strokeWidth={1.75} />}
        <span
          className={`numeric-display tnum text-base ${valueColor}`}
          style={{ fontVariationSettings: "'opsz' 144" }}
        >
          {value}
        </span>
        {caption && <span className="text-[11px] text-ink-faint ml-1">{caption}</span>}
      </div>
    </div>
  );
}

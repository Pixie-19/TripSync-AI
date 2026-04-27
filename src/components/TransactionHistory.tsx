"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Receipt, Handshake } from "lucide-react";

type Filter = "all" | "expense" | "settlement";

export default function TransactionHistory({
  tripId,
  members,
  currency = "INR",
}: {
  tripId: string;
  members: any[];
  currency?: string;
}) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel(`transactions-${tripId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions", filter: `trip_id=eq.${tripId}` },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });
    if (data) setTransactions(data);
  };

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.users?.full_name ?? m?.users?.email?.split("@")[0] ?? "Unknown";
  };

  const filtered = transactions.filter((t) => filter === "all" || t.type === filter);

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow-rule mb-2">Ledger history</div>
        <div className="flex gap-1 mt-3">
          {(["all", "expense", "settlement"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${
                filter === f ? "bg-ink text-[color:var(--surface-elevated)]" : "bg-tint text-ink-secondary hover:bg-tint-strong"
              }`}
            >
              {f === "all" ? "All" : f === "expense" ? "Expenses" : "Payments"}
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Receipt className="w-10 h-10" strokeWidth={1.5} />
          </div>
          <p className="empty-state__caption">No transactions yet.</p>
        </div>
      ) : (
        <ul className="rounded-lg border border-subtle overflow-hidden divide-y divide-[color:var(--border-subtle)]">
          {filtered.map((t) => {
            const isExpense = t.type === "expense";
            return (
              <li key={t.id} className="bg-elevated px-4 py-3.5 flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${isExpense ? "bg-danger-soft" : "bg-success-soft"}`}
                >
                  {isExpense ? (
                    <Receipt className={`w-4 h-4 text-danger`} strokeWidth={1.75} />
                  ) : (
                    <Handshake className={`w-4 h-4 text-success`} strokeWidth={1.75} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm text-ink">
                    <span className="truncate">{getMemberName(t.from_user_id)}</span>
                    <ArrowRight className="w-3 h-3 text-ink-faint flex-shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{getMemberName(t.to_user_id)}</span>
                  </div>
                  <div className="text-[11px] text-ink-muted mt-0.5 capitalize">
                    {t.type}
                  </div>
                </div>
                <div
                  className={`numeric-display tnum text-sm flex-shrink-0 ${isExpense ? "text-danger" : "text-success"}`}
                >
                  {formatCurrency(t.amount, currency)}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

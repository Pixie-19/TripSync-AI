"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Receipt, Handshake } from "lucide-react";

export default function TransactionHistory({ tripId, members, currency = "INR" }: { tripId: string, members: any[], currency?: string }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "expense" | "settlement">("all");

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel(`transactions-${tripId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions", filter: `trip_id=eq.${tripId}` }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  const filtered = transactions.filter(t => filter === "all" || t.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setFilter("all")} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === "all" ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/70"}`}>All</button>
        <button onClick={() => setFilter("expense")} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === "expense" ? "bg-rose-500 text-white border-rose-500" : "bg-white/5 border-white/10 text-white/70"}`}>Expenses</button>
        <button onClick={() => setFilter("settlement")} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === "settlement" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white/5 border-white/10 text-white/70"}`}>Payments</button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center text-white/40 text-sm py-8">No transactions yet</div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="glass-card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {t.type === 'expense' ? <Receipt className="w-5 h-5" /> : <Handshake className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-white truncate">{getMemberName(t.from_user_id)}</span>
                  <ArrowRight className="w-3 h-3 text-white/40 flex-shrink-0" />
                  <span className="font-semibold text-white truncate">{getMemberName(t.to_user_id)}</span>
                </div>
                <div className="text-xs text-white/50 mt-1 capitalize">{t.type}</div>
              </div>
              <div className={`font-bold ${t.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrency(t.amount, currency)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

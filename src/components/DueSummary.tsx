"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";

export default function DueSummary({ tripId, members }: { tripId: string, members: any[] }) {
  const { user } = useAuth();
  const [owes, setOwes] = useState<any[]>([]);
  const [owed, setOwed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchBalances();

    const channel = supabase
      .channel(`balances-summary-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "balances", filter: `trip_id=eq.${tripId}` }, () => {
        fetchBalances();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, tripId]);

  const fetchBalances = async () => {
    // You owe to others
    const { data: youOwe } = await supabase
      .from("balances")
      .select("*")
      .eq("trip_id", tripId)
      .eq("from_user_id", user?.id)
      .eq("status", "pending")
      .gt("amount", 0);

    // Others owe you
    const { data: othersOwe } = await supabase
      .from("balances")
      .select("*")
      .eq("trip_id", tripId)
      .eq("to_user_id", user?.id)
      .eq("status", "pending")
      .gt("amount", 0);

    if (youOwe) setOwes(youOwe);
    if (othersOwe) setOwed(othersOwe);
    setLoading(false);
  };

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.users?.full_name ?? m?.users?.email?.split("@")[0] ?? "Unknown";
  };

  if (loading) return <div className="skeleton h-24 w-full rounded-2xl" />;

  if (owes.length === 0 && owed.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {owes.length > 0 && (
        <div className="glass-card p-4 border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center gap-2 text-rose-400 mb-3 text-sm font-semibold">
            <TrendingDown className="w-4 h-4" />
            YOU OWE
          </div>
          <div className="space-y-2">
            {owes.map(o => (
              <div key={o.id} className="flex justify-between items-center text-sm">
                <span className="text-white/70">To {getMemberName(o.to_user_id)}</span>
                <span className="font-bold text-rose-400">{formatCurrency(o.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {owed.length > 0 && (
        <div className="glass-card p-4 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-400 mb-3 text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            YOU ARE OWED
          </div>
          <div className="space-y-2">
            {owed.map(o => (
              <div key={o.id} className="flex justify-between items-center text-sm">
                <span className="text-white/70">From {getMemberName(o.from_user_id)}</span>
                <span className="font-bold text-emerald-400">{formatCurrency(o.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

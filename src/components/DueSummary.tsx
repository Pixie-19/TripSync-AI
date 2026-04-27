"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function DueSummary({ tripId, members }: { tripId: string; members: any[] }) {
  const { user } = useAuth();
  const [owes, setOwes] = useState<any[]>([]);
  const [owed, setOwed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchBalances();

    const channel = supabase
      .channel(`balances-summary-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "balances", filter: `trip_id=eq.${tripId}` },
        () => {
          fetchBalances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tripId]);

  const fetchBalances = async () => {
    const { data: youOwe } = await supabase
      .from("balances")
      .select("*")
      .eq("trip_id", tripId)
      .eq("from_user_id", user?.id)
      .eq("status", "pending")
      .gt("amount", 0);

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

  if (loading) return <div className="skeleton h-20 w-full rounded-lg" />;
  if (owes.length === 0 && owed.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {owes.length > 0 && (
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 text-danger eyebrow mb-3">
            <TrendingDown className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>You owe</span>
          </div>
          <ul className="space-y-1.5">
            {owes.map((o) => (
              <li key={o.id} className="flex justify-between items-baseline text-sm">
                <span className="text-ink-secondary">→ {getMemberName(o.to_user_id)}</span>
                <span className="numeric-display tnum text-danger">{formatCurrency(o.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {owed.length > 0 && (
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 text-success eyebrow mb-3">
            <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>You&apos;re owed</span>
          </div>
          <ul className="space-y-1.5">
            {owed.map((o) => (
              <li key={o.id} className="flex justify-between items-baseline text-sm">
                <span className="text-ink-secondary">← {getMemberName(o.from_user_id)}</span>
                <span className="numeric-display tnum text-success">{formatCurrency(o.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

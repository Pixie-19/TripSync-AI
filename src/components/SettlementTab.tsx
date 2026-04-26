"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Handshake,
  ArrowRight,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, calculateSettlements } from "@/lib/utils";

interface Props {
  tripId: string;
  members: any[];
  trip: any;
}

export default function SettlementTab({ tripId, members, trip }: Props) {
  const [settlements, setSettlements] = useState<{ from: string; to: string; amount: number; settled?: boolean; id?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.users?.full_name ?? m?.users?.email?.split("@")[0] ?? userId;
  };

  const computeSettlements = useCallback(async () => {
    setLoading(true);

    const { data: expenses } = await supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId);

    if (!expenses || expenses.length === 0) {
      setSettlements([]);
      setLoading(false);
      return;
    }

    // Calculate net balances for each member
    const balances: Record<string, number> = {};
    members.forEach((m) => { balances[m.user_id] = 0; });

    expenses.forEach((e: any) => {
      const perPerson = e.amount / e.split_among.length;
      // Payer gets credited
      balances[e.paid_by] = (balances[e.paid_by] ?? 0) + e.amount;
      // Each split member gets debited
      e.split_among.forEach((uid: string) => {
        balances[uid] = (balances[uid] ?? 0) - perPerson;
      });
    });

    const computed = calculateSettlements(balances);

    // Check which are already settled in DB
    const { data: dbSettlements } = await supabase
      .from("settlements")
      .select("*")
      .eq("trip_id", tripId);

    const settledMap = new Map(
      (dbSettlements ?? []).map((s: any) => [`${s.from_user}:${s.to_user}`, s])
    );

    const merged = computed.map((s) => {
      const key = `${s.from}:${s.to}`;
      const db = settledMap.get(key);
      return { ...s, settled: db?.settled ?? false, id: db?.id };
    });

    setSettlements(merged);
    setLoading(false);
  }, [tripId, members]);

  useEffect(() => {
    computeSettlements();
  }, [computeSettlements]);

  const markSettled = async (settlement: typeof settlements[0]) => {
    setSaving(true);
    try {
      if (settlement.id) {
        await supabase
          .from("settlements")
          .update({ settled: true, settled_at: new Date().toISOString() })
          .eq("id", settlement.id);
      } else {
        await supabase.from("settlements").insert({
          trip_id: tripId,
          from_user: settlement.from,
          to_user: settlement.to,
          amount: settlement.amount,
          settled: true,
          settled_at: new Date().toISOString(),
        });
      }
      await computeSettlements();
    } finally {
      setSaving(false);
    }
  };

  const unsettledCount = settlements.filter((s) => !s.settled).length;
  const totalToSettle = settlements
    .filter((s) => !s.settled)
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              <Handshake className="w-5 h-5 text-emerald-400" />
              Settle Up
            </h3>
            <p className="text-white/50 text-sm mt-1">
              {unsettledCount === 0
                ? "All expenses settled!"
                : `${unsettledCount} payment${unsettledCount !== 1 ? "s" : ""} remaining`}
            </p>
          </div>
          <button
            onClick={computeSettlements}
            disabled={loading}
            className="btn-ghost text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {unsettledCount > 0 && (
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <div className="text-sm text-white/50">Total outstanding</div>
            <div className="text-2xl font-bold text-rose-400">{formatCurrency(totalToSettle)}</div>
          </div>
        )}

        {unsettledCount === 0 && settlements.length > 0 && (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <div className="font-semibold text-emerald-400">All settled up!</div>
            <div className="text-sm text-white/40 mt-1">Everyone's even. Time to plan the next trip!</div>
          </div>
        )}
      </div>

      {/* Settlement list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20" />)}
        </div>
      ) : settlements.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="font-semibold text-lg mb-2">No settlements needed</h3>
          <p className="text-white/40 text-sm">
            Add some expenses first to calculate who owes whom.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {settlements.map((settlement, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass-card p-5 flex items-center gap-4 ${
                settlement.settled ? "opacity-60" : ""
              }`}
            >
              {/* From */}
              <div className="flex flex-col items-center">
                <div className="avatar w-10 h-10 text-sm" style={{ background: settlement.settled ? "#64748b" : "linear-gradient(135deg, #f43f5e, #fb7185)" }}>
                  {getMemberName(settlement.from)[0]?.toUpperCase()}
                </div>
                <div className="text-xs text-white/50 mt-1 max-w-[70px] text-center truncate">
                  {getMemberName(settlement.from)}
                </div>
              </div>

              {/* Arrow + Amount */}
              <div className="flex-1 flex flex-col items-center">
                <div className={`font-display font-bold text-xl ${settlement.settled ? "text-white/30 line-through" : "text-brand-400"}`}>
                  {formatCurrency(settlement.amount, trip.currency)}
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs mt-1">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
                  <ArrowRight className="w-4 h-4" />
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
                </div>
              </div>

              {/* To */}
              <div className="flex flex-col items-center">
                <div className="avatar w-10 h-10 text-sm" style={{ background: settlement.settled ? "#64748b" : "linear-gradient(135deg, #10b981, #34d399)" }}>
                  {getMemberName(settlement.to)[0]?.toUpperCase()}
                </div>
                <div className="text-xs text-white/50 mt-1 max-w-[70px] text-center truncate">
                  {getMemberName(settlement.to)}
                </div>
              </div>

              {/* Action */}
              <div className="ml-auto">
                {settlement.settled ? (
                  <div className="flex items-center gap-1 text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Done
                  </div>
                ) : (
                  <button
                    onClick={() => markSettled(settlement)}
                    disabled={saving}
                    className="btn-secondary text-sm px-4 py-2"
                    id={`settle-btn-${i}`}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Paid"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Individual balances */}
      <div className="glass-card p-6">
        <h4 className="font-semibold mb-4">Individual Balances</h4>
        <MemberBalances tripId={tripId} members={members} />
      </div>
    </div>
  );
}

function MemberBalances({ tripId, members }: { tripId: string; members: any[] }) {
  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId)
      .then(({ data: expenses }) => {
        if (!expenses) return;
        const bal: Record<string, number> = {};
        members.forEach((m) => { bal[m.user_id] = 0; });
        expenses.forEach((e: any) => {
          const perPerson = e.amount / e.split_among.length;
          bal[e.paid_by] = (bal[e.paid_by] ?? 0) + e.amount;
          e.split_among.forEach((uid: string) => {
            bal[uid] = (bal[uid] ?? 0) - perPerson;
          });
        });
        setBalances(bal);
      });
  }, [tripId, members]);

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.users?.full_name ?? m?.users?.email?.split("@")[0] ?? "Unknown";
  };

  return (
    <div className="space-y-3">
      {Object.entries(balances).map(([userId, balance]) => (
        <div key={userId} className="flex items-center justify-between py-2 border-b border-white/8 last:border-0">
          <div className="flex items-center gap-3">
            <div className="avatar w-8 h-8 text-xs">
              {getMemberName(userId)[0]?.toUpperCase()}
            </div>
            <span className="text-sm">{getMemberName(userId)}</span>
          </div>
          <div className={`font-semibold text-sm ${balance > 0 ? "text-emerald-400" : balance < 0 ? "text-rose-400" : "text-white/40"}`}>
            {balance > 0 ? `+${formatCurrency(balance)}` : balance < 0 ? formatCurrency(balance) : "Settled ✓"}
          </div>
        </div>
      ))}
    </div>
  );
}

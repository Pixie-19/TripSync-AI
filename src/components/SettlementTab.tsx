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
import { formatCurrency } from "@/lib/utils";
import PaymentModal from "./PaymentModal";
import { useAuth } from "@/lib/AuthContext";
import DueSummary from "./DueSummary";
import { processPayment, recalculateBalances } from "@/lib/finance";

interface Props {
  tripId: string;
  members: any[];
  trip: any;
}

export default function SettlementTab({ tripId, members, trip }: Props) {
  const [settlements, setSettlements] = useState<{ from: string; to: string; amount: number; settled?: boolean; id?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePayment, setActivePayment] = useState<any>(null);
  const { user } = useAuth();
  const currentUserId = user?.id;

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.users?.full_name ?? m?.users?.email?.split("@")[0] ?? userId;
  };

  const getMemberAvatar = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.users?.avatar_url;
  };

  const computeSettlements = useCallback(async (forceRecalc = false) => {
    setLoading(true);
    
    if (forceRecalc) {
      console.log("Force recalculating balances...");
      await recalculateBalances(tripId);
    }

    console.log("Fetching balances for trip:", tripId);
    const { data, error } = await supabase
      .from("balances")
      .select("*")
      .eq("trip_id", tripId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Balance fetch error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
    console.log("Retrieved balances:", data);

    if (data) {
      const mapped = data.map(d => ({
        id: d.id,
        from: d.from_user_id,
        to: d.to_user_id,
        amount: d.amount,
        settled: d.status === 'settled'
      }));
      setSettlements(mapped);
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    computeSettlements();

    const channel = supabase
      .channel(`balances-realtime-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "balances", filter: `trip_id=eq.${tripId}` }, () => {
        console.log("Realtime update received for balances");
        computeSettlements();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [computeSettlements, tripId]);

  const markSettled = async (settlement: any) => {
    setSaving(true);
    try {
      console.log("Processing payment for:", settlement);
      await processPayment({
        tripId,
        payerId: settlement.from,
        receiverId: settlement.to,
        amount: settlement.amount,
        balanceId: settlement.id
      });
      await computeSettlements();
    } finally {
      setSaving(false);
    }
  };

  const relevantSettlements = settlements.filter(
    (s) => s.from === currentUserId || s.to === currentUserId
  );

  const unsettledCountToPay = relevantSettlements.filter((s) => !s.settled && s.from === currentUserId).length;
  const unsettledCountTotal = relevantSettlements.filter((s) => !s.settled).length;
  
  const totalToSettle = relevantSettlements
    .filter((s) => !s.settled && s.from === currentUserId)
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Due Summary Widgets */}
      <DueSummary tripId={tripId} members={members} />

      {/* Header card */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg sm:text-xl flex items-center gap-2">
              <Handshake className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              Settle Up
            </h3>
            <p className="text-white/50 text-xs sm:text-sm mt-0.5 sm:mt-1">
              {unsettledCountTotal === 0
                ? "All expenses settled!"
                : `${unsettledCountToPay} payment${unsettledCountToPay !== 1 ? "s" : ""} remaining`}
            </p>
          </div>
          <button
            onClick={() => computeSettlements(true)}
            disabled={loading}
            className="btn-ghost text-xs sm:text-sm"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
            Sync Ledger
          </button>
        </div>

        {unsettledCountToPay > 0 && (
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <div className="text-sm text-white/50">Total you owe</div>
            <div className="text-2xl font-bold text-rose-400">{formatCurrency(totalToSettle)}</div>
          </div>
        )}

        {unsettledCountTotal === 0 && relevantSettlements.length > 0 && (
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
      ) : relevantSettlements.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="font-semibold text-lg mb-2">You're all settled up!</h3>
          <p className="text-white/40 text-sm">
            No pending payments for you right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {relevantSettlements.map((settlement, i) => {
            const isPayer = settlement.from === currentUserId;
            const isReceiver = settlement.to === currentUserId;

            return (
              <motion.div
                key={settlement.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`glass-card p-3 sm:p-5 flex items-center gap-2 sm:gap-4 ${
                  settlement.settled ? "opacity-60" : ""
                }`}
              >
                {/* From */}
                <div className="flex flex-col items-center">
                  <div className="avatar w-10 h-10 text-sm overflow-hidden border border-white/10" style={{ background: settlement.settled ? "#64748b" : "linear-gradient(135deg, #f43f5e, #fb7185)" }}>
                    {getMemberAvatar(settlement.from) ? (
                      <img src={getMemberAvatar(settlement.from)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getMemberName(settlement.from)[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="text-xs text-white/50 mt-1 max-w-[70px] text-center truncate">
                    {getMemberName(settlement.from)}
                  </div>
                </div>

                {/* Arrow + Amount */}
                <div className="flex-1 flex flex-col items-center min-w-0">
                  <div className={`font-display font-bold text-sm sm:text-xl truncate ${settlement.settled ? "text-white/30 line-through" : "text-brand-400"}`}>
                    {formatCurrency(settlement.amount, trip.currency)}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-white/40 text-[10px] mt-0.5 sm:mt-1">
                    <div className="h-px w-4 sm:w-12 bg-gradient-to-r from-transparent to-white/20" />
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    <div className="h-px w-4 sm:w-12 bg-gradient-to-l from-transparent to-white/20" />
                  </div>
                </div>

                {/* To */}
                <div className="flex flex-col items-center">
                  <div className="avatar w-10 h-10 text-sm overflow-hidden border border-white/10" style={{ background: settlement.settled ? "#64748b" : "linear-gradient(135deg, #10b981, #34d399)" }}>
                    {getMemberAvatar(settlement.to) ? (
                      <img src={getMemberAvatar(settlement.to)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getMemberName(settlement.to)[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="text-xs text-white/50 mt-1 max-w-[70px] text-center truncate">
                    {getMemberName(settlement.to)}
                  </div>
                </div>

                {/* Action */}
                <div className="ml-auto">
                  {settlement.settled ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs sm:text-sm px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden min-[450px]:inline">Paid</span>
                    </div>
                  ) : isPayer ? (
                    <button
                      onClick={() => setActivePayment(settlement)}
                      disabled={saving}
                      className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-[10px] sm:text-sm px-3 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap shadow-[0_0_15px_rgba(16,185,129,0.3)] border-none"
                    >
                      Pay {formatCurrency(settlement.amount, trip.currency)}
                    </button>
                  ) : isReceiver ? (
                    <div className="flex items-center gap-1 text-brand-400 text-xs sm:text-sm px-2 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-semibold whitespace-nowrap">
                      Will Receive
                    </div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {activePayment && (
        <PaymentModal
          isOpen={!!activePayment}
          onClose={() => setActivePayment(null)}
          receiverName={getMemberName(activePayment.to)}
          amount={activePayment.amount}
          currency={trip.currency}
          onConfirm={async () => {
            await markSettled(activePayment);
            setActivePayment(null);
          }}
        />
      )}

      {/* Individual balances (Now showing all trip balances from table) */}
      <div className="glass-card p-6">
        <h4 className="font-semibold mb-4">Group Balances</h4>
        <MemberBalances tripId={tripId} members={members} />
      </div>
    </div>
  );
}

function MemberBalances({ tripId, members }: { tripId: string; members: any[] }) {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("balances")
      .select("*")
      .eq("trip_id", tripId)
      .gt("amount", 0)
      .then(({ data }) => {
        if (data) setBalances(data);
        setLoading(false);
      });
  }, [tripId]);

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.users?.full_name ?? m?.users?.email?.split("@")[0] ?? "Unknown";
  };

  const getMemberAvatar = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.users?.avatar_url;
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 w-full" />)}
        </>
      ) : balances.length === 0 ? (
        <div className="text-center text-white/40 text-sm py-4">No active balances</div>
      ) : (
        balances.map((b) => (
          <div key={b.id} className="flex items-center justify-between py-2 border-b border-white/8 last:border-0">
            <div className="flex items-center gap-2 text-sm text-white/70">
               <span className="font-medium text-white">{getMemberName(b.from_user_id)}</span>
               <ArrowRight className="w-3 h-3 opacity-40" />
               <span className="font-medium text-white">{getMemberName(b.to_user_id)}</span>
            </div>
            <div className={`font-semibold text-sm ${b.status === 'settled' ? 'text-white/20 line-through' : 'text-brand-400'}`}>
              {formatCurrency(b.amount)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

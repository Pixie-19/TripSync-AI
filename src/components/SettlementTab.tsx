"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Handshake,
  ArrowRight,
  CheckCircle,
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
  const [settlements, setSettlements] = useState<
    { from: string; to: string; amount: number; settled?: boolean; id?: string }[]
  >([]);
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

  const computeSettlements = useCallback(
    async (forceRecalc = false) => {
      setLoading(true);

      if (forceRecalc) {
        await recalculateBalances(tripId);
      }

      const { data } = await supabase
        .from("balances")
        .select("*")
        .eq("trip_id", tripId)
        .order("updated_at", { ascending: false });

      if (data) {
        const mapped = data.map((d) => ({
          id: d.id,
          from: d.from_user_id,
          to: d.to_user_id,
          amount: d.amount,
          settled: d.status === "settled",
        }));
        setSettlements(mapped);
      }
      setLoading(false);
    },
    [tripId]
  );

  useEffect(() => {
    computeSettlements();

    // Realtime channel name preserved
    const channel = supabase
      .channel(`balances-realtime-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "balances", filter: `trip_id=eq.${tripId}` },
        () => {
          computeSettlements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [computeSettlements, tripId]);

  const markSettled = async (settlement: any) => {
    setSaving(true);
    try {
      await processPayment({
        tripId,
        payerId: settlement.from,
        receiverId: settlement.to,
        amount: settlement.amount,
        balanceId: settlement.id,
      });
      await computeSettlements();
    } finally {
      setSaving(false);
    }
  };

  const relevantSettlements = settlements.filter(
    (s) => s.from === currentUserId || s.to === currentUserId
  );
  const unsettled = relevantSettlements.filter((s) => !s.settled);
  const unsettledToPay = unsettled.filter((s) => s.from === currentUserId);

  const totalToSettle = unsettledToPay.reduce((sum, s) => sum + s.amount, 0);
  const totalToReceive = unsettled
    .filter((s) => s.to === currentUserId)
    .reduce((sum, s) => sum + s.amount, 0);

  const net = totalToReceive - totalToSettle;

  // Find largest "you owe" line for the saffron emphasis rule
  const largestOwedId = unsettledToPay.length > 0
    ? unsettledToPay.reduce((maxS, s) => (s.amount > maxS.amount ? s : maxS), unsettledToPay[0]).id
    : null;

  return (
    <div className="space-y-10">
      {/* Headline numbers */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-default rounded-lg overflow-hidden border border-subtle">
          <HeadCell
            label="You owe"
            value={formatCurrency(totalToSettle, trip.currency)}
            tone={totalToSettle > 0 ? "danger" : undefined}
          />
          <HeadCell
            label="You're owed"
            value={formatCurrency(totalToReceive, trip.currency)}
            tone={totalToReceive > 0 ? "success" : undefined}
          />
          <HeadCell
            label="Net position"
            value={`${net >= 0 ? "+" : ""}${formatCurrency(net, trip.currency)}`}
            tone={net > 0 ? "success" : net < 0 ? "danger" : undefined}
            caption={net === 0 ? "even" : net > 0 ? "to receive" : "to pay"}
          />
        </div>
      </section>

      {/* Due summary widgets */}
      <DueSummary tripId={tripId} members={members} />

      {/* Action header */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="eyebrow-rule mb-2">Outstanding</div>
            <h3
              className="font-display text-2xl text-ink"
              style={{ fontWeight: 500, letterSpacing: "-0.01em", fontVariationSettings: "'opsz' 144" }}
            >
              <Handshake className="inline w-5 h-5 text-accent mr-2 -translate-y-0.5" strokeWidth={1.5} />
              {unsettled.length === 0
                ? "All settled up"
                : `${unsettledToPay.length} to pay`}
            </h3>
          </div>
          <button
            onClick={() => computeSettlements(true)}
            disabled={loading}
            className="btn-ghost text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync ledger
          </button>
        </div>

        {/* Settlement list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16" />
            ))}
          </div>
        ) : relevantSettlements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <CheckCircle className="w-10 h-10 text-success" strokeWidth={1.5} />
            </div>
            <div className="empty-state__title">You&apos;re all settled up</div>
            <p className="empty-state__caption">
              No pending payments for you right now.
            </p>
          </div>
        ) : (
          <ul className="rounded-lg border border-subtle overflow-hidden divide-y divide-[color:var(--border-subtle)]">
            {relevantSettlements.map((settlement, i) => {
              const isPayer = settlement.from === currentUserId;
              const isReceiver = settlement.to === currentUserId;
              const isLargestOwed = settlement.id === largestOwedId;

              return (
                <li
                  key={settlement.id || i}
                  className={`relative bg-elevated px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-5 ${settlement.settled ? "opacity-60" : ""}`}
                >
                  {isLargestOwed && !settlement.settled && (
                    <span
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-highlight"
                      aria-label="Most owed line"
                    />
                  )}
                  {/* From */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getMemberAvatar(settlement.from) ? (
                      <img
                        src={getMemberAvatar(settlement.from)}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="avatar w-8 h-8 text-xs">
                        {getMemberName(settlement.from)[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-ink truncate max-w-[8rem]">
                      {isPayer ? "You" : getMemberName(settlement.from)}
                    </span>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" strokeWidth={1.75} />

                  {/* To */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-1 min-w-0">
                    {getMemberAvatar(settlement.to) ? (
                      <img
                        src={getMemberAvatar(settlement.to)}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="avatar w-8 h-8 text-xs">
                        {getMemberName(settlement.to)[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-ink truncate max-w-[8rem]">
                      {isReceiver ? "You" : getMemberName(settlement.to)}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0 mr-2">
                    <div
                      className={`numeric-display tnum text-base ${settlement.settled ? "text-ink-faint line-through" : isLargestOwed ? "text-highlight" : "text-ink"}`}
                    >
                      {formatCurrency(settlement.amount, trip.currency)}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    {settlement.settled ? (
                      <span className="badge badge--success">
                        <CheckCircle className="w-3 h-3" />
                        Paid
                      </span>
                    ) : isPayer ? (
                      <button
                        onClick={() => setActivePayment(settlement)}
                        disabled={saving}
                        className="btn-primary btn-sm"
                      >
                        Pay
                      </button>
                    ) : isReceiver ? (
                      <span className="badge">
                        <ArrowRight className="w-3 h-3" />
                        Will receive
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

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

      {/* All trip balances */}
      <section>
        <div className="eyebrow-rule mb-4">Group balances</div>
        <MemberBalances tripId={tripId} members={members} />
      </section>
    </div>
  );
}

function HeadCell({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: "success" | "danger";
}) {
  const valueColor =
    tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div className="bg-elevated px-6 py-6">
      <div className="eyebrow mb-3">{label}</div>
      <div
        className={`numeric-display tnum text-3xl ${valueColor}`}
        style={{ fontVariationSettings: "'opsz' 144" }}
      >
        {value}
      </div>
      {caption && <div className="text-[11px] text-ink-muted mt-1 capitalize">{caption}</div>}
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

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-10" />
        ))}
      </div>
    );
  }

  if (balances.length === 0) {
    return <div className="text-center text-ink-muted text-sm py-4">No active balances</div>;
  }

  return (
    <ul className="rounded-lg border border-subtle overflow-hidden divide-y divide-[color:var(--border-subtle)]">
      {balances.map((b) => (
        <li
          key={b.id}
          className="bg-elevated flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink">{getMemberName(b.from_user_id)}</span>
            <ArrowRight className="w-3 h-3 text-ink-faint" strokeWidth={1.75} />
            <span className="text-ink">{getMemberName(b.to_user_id)}</span>
          </div>
          <div
            className={`numeric-display tnum text-sm ${b.status === "settled" ? "text-ink-faint line-through" : "text-ink"}`}
          >
            {formatCurrency(b.amount)}
          </div>
        </li>
      ))}
    </ul>
  );
}

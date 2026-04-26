"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, calculateSettlements } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface MemberSummary {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  totalPaid: number;
  totalShare: number;
  netBalance: number;
}

interface Props {
  tripId: string;
  members: any[];
}

export default function GroupSummary({ tripId, members }: Props) {
  const router = useRouter();
  const [summaries, setSummaries] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const computeSummaries = useCallback(async () => {
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId);

    if (!expenses) { setLoading(false); return; }

    const paid: Record<string, number> = {};
    const share: Record<string, number> = {};

    members.forEach((m) => {
      paid[m.user_id] = 0;
      share[m.user_id] = 0;
    });

    expenses.forEach((e: any) => {
      paid[e.paid_by] = (paid[e.paid_by] ?? 0) + e.amount;
      const perPerson = e.amount / (e.split_among?.length || 1);
      e.split_among?.forEach((uid: string) => {
        share[uid] = (share[uid] ?? 0) + perPerson;
      });
    });

    const result: MemberSummary[] = members.map((m) => {
      const userId = m.user_id;
      const totalPaid = paid[userId] ?? 0;
      const totalShare = share[userId] ?? 0;
      return {
        userId,
        name: m.users?.full_name ?? m.users?.email?.split("@")[0] ?? "Member",
        email: m.users?.email ?? "",
        avatarUrl: m.users?.avatar_url ?? null,
        totalPaid,
        totalShare,
        netBalance: totalPaid - totalShare,
      };
    });

    // Sort: biggest creditors first
    setSummaries(result.sort((a, b) => b.netBalance - a.netBalance));
    setLoading(false);
  }, [tripId, members]);

  useEffect(() => {
    computeSummaries();
  }, [computeSummaries]);

  if (loading) return null;
  if (summaries.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-5 h-5 text-brand-400" />
        <h4 className="font-display font-semibold text-lg">Group Summary</h4>
      </div>

      <div className="space-y-3">
        {summaries.map((m, i) => {
          const isPositive = m.netBalance >= 0;
          return (
            <motion.div
              key={m.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/4 transition-colors group"
            >
              {/* Avatar */}
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {m.name[0]?.toUpperCase()}
                </div>
              )}

              {/* Name + bars */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{m.name}</span>
                  <button
                    onClick={() => router.push(`/profile/${m.userId}`)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-brand-400"
                    aria-label={`View ${m.name} profile`}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5 flex-wrap">
                  <span>Paid {formatCurrency(m.totalPaid)}</span>
                  <span>Share {formatCurrency(m.totalShare)}</span>
                </div>
              </div>

              {/* Net Balance Badge */}
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0 ${
                isPositive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
              }`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isPositive ? "+" : ""}{formatCurrency(m.netBalance)}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/8 text-xs text-white/30 text-center">
        Green = gets money back · Red = owes money · Click name to view profile
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
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

    if (!expenses) {
      setLoading(false);
      return;
    }

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

    setSummaries(result.sort((a, b) => b.netBalance - a.netBalance));
    setLoading(false);
  }, [tripId, members]);

  useEffect(() => {
    computeSummaries();
  }, [computeSummaries]);

  if (loading) return null;
  if (summaries.length === 0) return null;

  const maxAbs = Math.max(...summaries.map((s) => Math.abs(s.netBalance)), 1);

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-accent" strokeWidth={1.75} />
        <span className="eyebrow">Group ledger</span>
      </div>

      <ul className="rounded-lg border border-subtle overflow-hidden divide-y divide-[color:var(--border-subtle)]">
        {summaries.map((m) => {
          const isPositive = m.netBalance >= 0;
          const widthPct = maxAbs > 0 ? (Math.abs(m.netBalance) / maxAbs) * 100 : 0;
          return (
            <li
              key={m.userId}
              className="bg-elevated px-4 py-3 flex items-center gap-3 group cursor-pointer hover:bg-overlay transition-colors"
              onClick={() => router.push(`/profile/${m.userId}`)}
            >
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="avatar w-9 h-9 text-sm flex-shrink-0">
                  {m.name[0]?.toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink truncate">{m.name}</span>
                  <ExternalLink className="w-3 h-3 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-ink-muted mt-0.5">
                  <span>Paid <span className="tnum text-ink-secondary">{formatCurrency(m.totalPaid)}</span></span>
                  <span>Share <span className="tnum text-ink-secondary">{formatCurrency(m.totalShare)}</span></span>
                </div>
                {/* Bar */}
                <div className="mt-2 h-0.5 w-full rounded-full bg-tint relative overflow-hidden">
                  <div
                    className={`absolute top-0 bottom-0 ${isPositive ? "left-1/2 bg-success" : "right-1/2 bg-danger"}`}
                    style={{ width: `${widthPct / 2}%` }}
                  />
                </div>
              </div>

              <div
                className={`flex items-center gap-1 numeric-display tnum text-sm flex-shrink-0 ${isPositive ? "text-success" : "text-danger"}`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" strokeWidth={1.75} />
                ) : (
                  <TrendingDown className="w-3 h-3" strokeWidth={1.75} />
                )}
                {isPositive ? "+" : ""}
                {formatCurrency(m.netBalance)}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-ink-faint text-center mt-3">
        Click a name to view their public profile.
      </p>
    </section>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Brain,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, getCategoryIcon, getDaysCount } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetInsight } from "@/lib/ai";
import GroupSummary from "@/components/GroupSummary";

// Single-accent palette + ink-tonal cells
const CHART_TOKENS = [
  "var(--accent)",
  "var(--accent-hover)",
  "var(--highlight)",
  "var(--saffron-300)",
  "var(--ink-muted)",
  "var(--ink-faint)",
];

interface Props {
  tripId: string;
  trip: any;
  totalSpent: number;
  members?: any[];
}

export default function InsightsTab({ tripId, trip, totalSpent, members = [] }: Props) {
  const [insights, setInsights] = useState<BudgetInsight[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [memberData, setMemberData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenseData = useCallback(async () => {
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*, paid_by_user:users!expenses_paid_by_fkey(full_name, email)")
      .eq("trip_id", tripId);

    if (!expenses) return;

    const catMap: Record<string, number> = {};
    const memberMap: Record<string, number> = {};

    expenses.forEach((e: any) => {
      catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;
      const name =
        e.paid_by_user?.full_name ?? e.paid_by_user?.email?.split("@")[0] ?? "Unknown";
      memberMap[name] = (memberMap[name] ?? 0) + e.amount;
    });

    setCategoryData(
      Object.entries(catMap).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        icon: getCategoryIcon(name),
      }))
    );

    setMemberData(
      Object.entries(memberMap)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
    );

    return catMap;
  }, [tripId]);

  const generateInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    const catMap = await fetchExpenseData();
    if (!catMap) {
      setError("No expense data available yet.");
      setLoading(false);
      return;
    }

    const daysLeft = Math.max(
      0,
      getDaysCount(new Date().toISOString().split("T")[0], trip.end_date) - 1
    );

    try {
      const response = await fetch("/api/budget-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalBudget: trip.budget,
          totalSpent,
          categoryBreakdown: catMap,
          numDaysLeft: daysLeft,
          destination: trip.destination,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? "Failed to get insights");
      }

      const json = await response.json();
      setInsights(json.data || []);
    } catch (e: any) {
      setError(e.message ?? "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  }, [fetchExpenseData, trip, totalSpent]);

  useEffect(() => {
    fetchExpenseData();
  }, [fetchExpenseData]);

  const percentSpent = Math.round((totalSpent / trip.budget) * 100);
  const isOverBudget = totalSpent > trip.budget;

  // Find an insight to use as the lead pull-quote
  const leadInsight = insights[0];

  const iconForType = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" strokeWidth={1.75} />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-success" strokeWidth={1.75} />;
      case "tip":
        return <Lightbulb className="w-4 h-4 text-accent" strokeWidth={1.75} />;
      default:
        return <Info className="w-4 h-4 text-ink-muted" strokeWidth={1.75} />;
    }
  };

  return (
    <div className="space-y-10">
      {/* Lead pull-quote */}
      {leadInsight && (
        <blockquote className="pull-quote">
          {leadInsight.message}
          <footer className="mt-3 eyebrow text-ink-subtle">— AI ledger note</footer>
        </blockquote>
      )}

      {/* Group Summary */}
      {members.length > 0 && <GroupSummary tripId={tripId} members={members} />}

      {/* Budget overview */}
      <section>
        <div className="eyebrow-rule mb-4">Budget overview</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-default rounded-lg overflow-hidden border border-subtle">
          <BudgetCell
            label="Total budget"
            value={formatCurrency(trip.budget)}
            caption={`for ${trip.num_people} people`}
          />
          <BudgetCell
            label="Total spent"
            value={formatCurrency(totalSpent)}
            caption={`${percentSpent}% of budget`}
            tone={isOverBudget ? "danger" : "success"}
          />
          <BudgetCell
            label={isOverBudget ? "Over by" : "Remaining"}
            value={formatCurrency(Math.abs(trip.budget - totalSpent))}
            caption={`${Math.round((trip.budget - totalSpent) / trip.num_people)} per person`}
            tone={isOverBudget ? "danger" : undefined}
          />
        </div>
      </section>

      {/* Charts */}
      {categoryData.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="surface-card p-5">
            <div className="eyebrow mb-4">Spending by category</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="var(--surface-elevated)"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_TOKENS[i % CHART_TOKENS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), ""]}
                  contentStyle={{
                    background: "var(--surface-overlay)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "var(--ink-primary)" }}
                  itemStyle={{ color: "var(--ink-primary)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-4">
              {categoryData.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <li key={cat.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: CHART_TOKENS[i % CHART_TOKENS.length] }}
                    />
                    <Icon className="w-3 h-3 text-ink-muted" strokeWidth={1.75} />
                    <span className="text-ink-secondary truncate">{cat.name}</span>
                    <span className="ml-auto numeric-display tnum text-ink">
                      {formatCurrency(cat.value)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {memberData.length > 0 && (
            <div className="surface-card p-5">
              <div className="eyebrow mb-4">Who paid most</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={memberData} barSize={20}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--border-default)" }}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v: any) => [formatCurrency(v), "Paid"]}
                    contentStyle={{
                      background: "var(--surface-overlay)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      color: "var(--ink-primary)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="var(--accent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      )}

      {/* AI insights */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="eyebrow-rule mb-2">Notes</div>
            <h4
              className="font-display text-2xl text-ink"
              style={{ fontWeight: 500, fontVariationSettings: "'opsz' 144" }}
            >
              <Brain className="inline w-4 h-4 text-accent mr-2 -translate-y-0.5" strokeWidth={1.75} />
              AI budget notes
            </h4>
          </div>
          <button
            onClick={generateInsights}
            disabled={loading}
            className="btn-secondary btn-sm"
            id="generate-insights-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> {insights.length > 0 ? "Refresh" : "Analyze"}
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg border border-danger bg-danger-soft text-danger text-sm mb-4">
            {error}
          </div>
        )}

        {insights.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Brain className="w-10 h-10" strokeWidth={1.5} />
            </div>
            <p className="empty-state__caption">
              Click <em>Analyze</em> for personalized budget notes for your trip.
            </p>
          </div>
        )}

        {insights.length > 0 && (
          <ul className="rounded-lg border border-subtle overflow-hidden divide-y divide-[color:var(--border-subtle)]">
            {insights.map((insight, i) => (
              <li key={i} className="bg-elevated px-4 py-4 flex gap-3">
                <div className="flex-shrink-0 mt-0.5">{iconForType(insight.type)}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink mb-1">
                    {insight.title}
                  </div>
                  <div className="text-sm text-ink-secondary leading-relaxed">{insight.message}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BudgetCell({
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
    <div className="bg-elevated px-5 py-5">
      <div className="eyebrow mb-2">{label}</div>
      <div
        className={`numeric-display tnum text-2xl ${valueColor}`}
        style={{ fontVariationSettings: "'opsz' 144" }}
      >
        {value}
      </div>
      {caption && <div className="text-[11px] text-ink-muted mt-1">{caption}</div>}
    </div>
  );
}

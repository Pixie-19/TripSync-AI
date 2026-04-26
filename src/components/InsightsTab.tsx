"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, RefreshCw, Loader2, TrendingUp, AlertTriangle, CheckCircle, Info, Lightbulb } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, getCategoryColor, getCategoryIcon, getDaysCount } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import type { BudgetInsight } from "@/lib/ai";
import GroupSummary from "@/components/GroupSummary";


const COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#64748b"];

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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenseData = useCallback(async () => {
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*, paid_by_user:users!expenses_paid_by_fkey(full_name, email)")
      .eq("trip_id", tripId);

    if (!expenses) return;

    // Category breakdown
    const catMap: Record<string, number> = {};
    const memberMap: Record<string, number> = {};

    expenses.forEach((e: any) => {
      catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;
      const name = e.paid_by_user?.full_name ?? e.paid_by_user?.email?.split("@")[0] ?? "Unknown";
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

    setDataLoaded(true);
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

    const daysLeft = Math.max(0, getDaysCount(new Date().toISOString().split("T")[0], trip.end_date) - 1);

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

  const iconForType = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "success": return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "tip": return <Lightbulb className="w-5 h-5 text-brand-400" />;
      default: return <Info className="w-5 h-5 text-violet-400" />;
    }
  };

  const bgForType = (type: string) => {
    switch (type) {
      case "warning": return "border-amber-500/30 bg-amber-500/5";
      case "success": return "border-emerald-500/30 bg-emerald-500/5";
      case "tip": return "border-brand-500/30 bg-brand-500/5";
      default: return "border-violet-500/30 bg-violet-500/5";
    }
  };

  return (
    <div className="space-y-6">
      {/* Group Member Summary */}
      {members.length > 0 && <GroupSummary tripId={tripId} members={members} />}

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="text-white/50 text-sm mb-1">Total Budget</div>
          <div className="font-display font-bold text-2xl text-brand-400">{formatCurrency(trip.budget)}</div>
          <div className="text-xs text-white/30 mt-1">for {trip.num_people} people</div>
        </div>
        <div className={`glass-card p-5 ${isOverBudget ? "border-rose-500/30" : "border-emerald-500/30"}`}>
          <div className="text-white/50 text-sm mb-1">Total Spent</div>
          <div className={`font-display font-bold text-2xl ${isOverBudget ? "text-rose-400" : "text-emerald-400"}`}>
            {formatCurrency(totalSpent)}
          </div>
          <div className="text-xs text-white/30 mt-1">{percentSpent}% of budget</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-white/50 text-sm mb-1">{isOverBudget ? "Over by" : "Remaining"}</div>
          <div className={`font-display font-bold text-2xl ${isOverBudget ? "text-rose-400" : "text-violet-400"}`}>
            {formatCurrency(Math.abs(trip.budget - totalSpent))}
          </div>
          <div className="text-xs text-white/30 mt-1">
            ₹{Math.round((trip.budget - totalSpent) / trip.num_people)} per person
          </div>
        </div>
      </div>

      {/* Charts */}
      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="glass-card p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-400" /> Spending by Category
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} strokeWidth={2} stroke="rgba(255,255,255,0.05)">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), ""]}
                  contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-white/60">{cat.icon} {cat.name}</span>
                  <span className="ml-auto text-white/80 font-medium">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Member spending */}
          {memberData.length > 0 && (
            <div className="glass-card p-6">
              <h4 className="font-semibold mb-4">Who Paid Most</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={memberData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v: any) => [formatCurrency(v), "Paid"]}
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc" }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {memberData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* AI Insights */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-display font-semibold text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-400" />
            AI Budget Insights
          </h4>
          <button
            onClick={generateInsights}
            disabled={loading}
            className="btn-secondary text-sm"
            id="generate-insights-btn"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><RefreshCw className="w-4 h-4" /> {insights.length > 0 ? "Refresh" : "Analyze"}</>
            )}
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm mb-4">
            {error}
          </div>
        )}

        {insights.length === 0 && !loading && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-brand-400/40 mx-auto mb-3" />
            <p className="text-white/40 text-sm">
              Click "Analyze" to get personalized AI budget insights for your trip
            </p>
          </div>
        )}

        <div className="space-y-3">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-xl border ${bgForType(insight.type)} flex gap-4`}
            >
              <div className="flex-shrink-0 mt-0.5">{iconForType(insight.type)}</div>
              <div>
                <div className="font-semibold text-sm mb-1">
                  <span className="mr-2">{insight.icon}</span>
                  {insight.title}
                </div>
                <div className="text-sm text-white/60">{insight.message}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

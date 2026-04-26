"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User, Mail, TrendingUp, TrendingDown, DollarSign, Loader2, ReceiptText, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, getCategoryIcon, getCategoryColor } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
  trip_id: string;
  trip_title?: string;
}

export default function FriendProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalOwed, setTotalOwed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sharedTrips, setSharedTrips] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    // Fetch user profile
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userData) setProfile(userData);

    // Fetch all expenses paid by this user
    const { data: paidExpenses } = await supabase
      .from("expenses")
      .select("*, trips(title)")
      .eq("paid_by", userId)
      .order("created_at", { ascending: false });

    const paid = paidExpenses ?? [];
    setExpenses(paid.map((e: any) => ({ ...e, trip_title: e.trips?.title })));
    setTotalPaid(paid.reduce((s: number, e: any) => s + e.amount, 0));

    // Fetch all expenses split with this user (what they owe)
    const { data: splitExpenses } = await supabase
      .from("expenses")
      .select("amount, split_among")
      .contains("split_among", [userId]);

    const owed = (splitExpenses ?? []).reduce((s: number, e: any) => {
      return s + e.amount / (e.split_among?.length || 1);
    }, 0);
    setTotalOwed(owed);

    // Shared trips
    const { data: trips } = await supabase
      .from("trip_members")
      .select("trip_id, trips(title, destination)")
      .eq("user_id", userId);

    setSharedTrips(trips?.map((t: any) => t.trips).filter(Boolean) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) { router.replace("/auth"); return; }
    fetchData();
  }, [authLoading, currentUser, router, fetchData]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  const netBalance = totalPaid - totalOwed;
  const isPositive = netBalance >= 0;

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="fixed inset-0 pointer-events-none">
        <div className="glow-orb w-[400px] h-[400px] bg-brand-600/10 top-0 right-0" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/8 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="btn-ghost p-2" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-bold truncate">
            {profile?.full_name ?? profile?.email ?? "Traveler Profile"}
          </span>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-brand-500/20 flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-3xl font-bold flex-shrink-0">
                {(profile?.full_name ?? profile?.email ?? "?")[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-display font-bold text-2xl mb-1">{profile?.full_name ?? "Traveler"}</h1>
              <div className="flex items-center gap-2 text-white/50 text-sm justify-center sm:justify-start">
                <Mail className="w-4 h-4" />
                {profile?.email}
              </div>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs">
                  {sharedTrips.length} shared trips
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Financial Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="glass-card p-5 bg-gradient-to-br from-brand-500/10 to-brand-600/5 border border-brand-500/20">
            <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
              <DollarSign className="w-4 h-4 text-brand-400" /> Total Paid
            </div>
            <div className="font-display font-bold text-2xl text-brand-400">{formatCurrency(totalPaid)}</div>
          </div>
          <div className="glass-card p-5 bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20">
            <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
              <TrendingDown className="w-4 h-4 text-rose-400" /> Total Owed (share)
            </div>
            <div className="font-display font-bold text-2xl text-rose-400">{formatCurrency(totalOwed)}</div>
          </div>
          <div className={`glass-card p-5 bg-gradient-to-br border ${isPositive ? "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20" : "from-rose-500/10 to-rose-600/5 border-rose-500/20"}`}>
            <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
              {isPositive ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
              Net Balance
            </div>
            <div className={`font-display font-bold text-2xl ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isPositive ? "+" : ""}{formatCurrency(netBalance)}
            </div>
            <div className="text-xs text-white/30 mt-1">{isPositive ? "Gets back money" : "Owes money"}</div>
          </div>
        </motion.div>

        {/* Spending by Category */}
        {Object.keys(categoryTotals).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-brand-400" /> Spending by Category
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
                <div key={cat} className={`flex items-center gap-3 p-3 rounded-xl ${getCategoryColor(cat).split(" ").filter(c => c.startsWith("bg")).join(" ")}`}>
                  <span className="text-xl">{getCategoryIcon(cat)}</span>
                  <div>
                    <div className="text-xs text-white/50 capitalize">{cat}</div>
                    <div className="font-semibold text-sm">{formatCurrency(total)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Expenses Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-400" /> Expense History
          </h3>
          {expenses.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-6">No expenses recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 10).map((expense, i) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${getCategoryColor(expense.category).split(" ").filter(c => c.startsWith("bg")).join(" ")}`}>
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{expense.title}</div>
                    <div className="text-xs text-white/40">
                      {expense.trip_title && <span className="text-brand-400/70">{expense.trip_title} · </span>}
                      {format(new Date(expense.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-brand-400 flex-shrink-0">{formatCurrency(expense.amount)}</div>
                </motion.div>
              ))}
              {expenses.length > 10 && (
                <p className="text-center text-white/30 text-xs pt-2">Showing 10 of {expenses.length} expenses</p>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

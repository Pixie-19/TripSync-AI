"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Loader2,
  ReceiptText,
  Trash2,
  Filter,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  formatCurrency,
  autoCategorize,
  getCategoryIcon,
  getCategoryColor,
} from "@/lib/utils";
import { format } from "date-fns";
import { AppUser } from "@/lib/types";
import AutoDetectExpense from "@/components/AutoDetectExpense";


const CATEGORIES = ["food", "transport", "stay", "activities", "shopping", "other"] as const;

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  paid_by: string;
  split_among: string[];
  description: string | null;
  created_at: string;
}

interface Props {
  tripId: string;
  members: any[];
  user: AppUser | null;
  onExpenseChange: () => void;
}

export default function ExpensesTab({ tripId, members, user, onExpenseChange }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "other" as typeof CATEGORIES[number],
    paid_by: user?.id ?? "",
    split_among: members.map((m) => m.user_id) as string[],
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });
    if (data) setExpenses(data);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    fetchExpenses();

    // Real-time
    const channel = supabase
      .channel(`expenses-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `trip_id=eq.${tripId}` }, () => {
        fetchExpenses();
        onExpenseChange();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tripId, fetchExpenses, onExpenseChange]);

  // Auto-categorize when title changes
  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      category: autoCategorize(title),
    }));
  };

  const handleAutoDetected = (expense: { title: string; amount: number; category: string; description: string }) => {
    setForm((f) => ({
      ...f,
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category as typeof CATEGORIES[number],
      description: expense.description,
    }));
    setShowAdd(true);
  };

  const toggleSplitMember = (userId: string) => {
    setForm((f) => ({
      ...f,
      split_among: f.split_among.includes(userId)
        ? f.split_among.filter((id) => id !== userId)
        : [...f.split_among, userId],
    }));
  };

  const handleSave = async () => {
    if (!form.title || !form.amount || !form.paid_by || form.split_among.length === 0) {
      setFormError("Please fill all required fields and select at least one person to split with.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const { error } = await supabase.from("expenses").insert({
        trip_id: tripId,
        title: form.title,
        amount: parseFloat(form.amount),
        category: form.category,
        paid_by: form.paid_by,
        split_among: form.split_among,
        description: form.description || null,
      });

      if (error) throw error;

      setShowAdd(false);
      setForm({
        title: "",
        amount: "",
        category: "other",
        paid_by: user?.id ?? "",
        split_among: members.map((m) => m.user_id),
        description: "",
      });
    } catch (e: any) {
      setFormError(e.message ?? "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
  };

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.users?.full_name ?? m?.users?.email?.split("@")[0] ?? "Unknown";
  };

  const filtered = expenses.filter((e) => {
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);
  const categoryTotals = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Category Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(filterCategory === cat ? "all" : cat)}
            className={`glass-card p-3 text-center transition-all duration-200 ${
              filterCategory === cat ? "border-brand-500/40 bg-brand-500/10" : "hover:border-white/20"
            }`}
          >
            <div className="flex justify-center mb-1">
              {(() => {
                const Icon = getCategoryIcon(cat);
                return <Icon className="w-6 h-6" />;
              })()}
            </div>
            <div className="text-xs font-medium capitalize">{cat}</div>
            <div className="text-xs text-white/50 mt-0.5">
              {formatCurrency(categoryTotals[cat])}
            </div>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            className="input-field pl-10"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary"
          id="add-expense-btn"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Expense List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">💸</div>
          <h3 className="font-semibold text-lg mb-2">No expenses yet</h3>
          <p className="text-white/40 text-sm">
            {searchQuery ? "No expenses match your search." : "Add your first expense to start tracking!"}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">{filtered.length} expense{filtered.length !== 1 ? "s" : ""}</span>
            <span className="text-brand-400 font-semibold">Total: {formatCurrency(totalFiltered)}</span>
          </div>
          <div className="space-y-3">
            {filtered.map((expense, i) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-hover p-4 flex items-center gap-4 group transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getCategoryColor(expense.category)}`}>
                  {(() => {
                    const Icon = getCategoryIcon(expense.category);
                    return <Icon className="w-5 h-5" />;
                  })()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{expense.title}</div>
                  <div className="text-sm text-white/40 flex items-center gap-2 mt-0.5">
                    <span>Paid by {getMemberName(expense.paid_by)}</span>
                    <span>•</span>
                    <span>Split {expense.split_among.length} ways</span>
                    <span>•</span>
                    <span>{format(new Date(expense.created_at), "MMM d")}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg text-brand-400">
                    {formatCurrency(expense.amount)}
                  </div>
                  <div className="text-xs text-white/40">
                    {formatCurrency(expense.amount / expense.split_among.length)} each
                  </div>
                </div>

                {expense.paid_by === user?.id && (
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity btn-ghost p-2 text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative glass-card w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/8 sticky top-0 bg-dark-800/90 backdrop-blur-lg z-10 rounded-t-2xl">
                <h3 className="font-display font-bold text-lg">Add Expense</h3>
                <button onClick={() => setShowAdd(false)} className="btn-ghost p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Auto-detect UPI/SMS */}
                <AutoDetectExpense onExpenseDetected={handleAutoDetected} />

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Title * (auto-categorizes)</label>
                  <input
                    id="expense-title"
                    className="input-field"
                    placeholder="e.g. Zomato dinner, Uber to hotel..."
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block">Amount *</label>
                    <input
                      id="expense-amount"
                      type="number"
                      className="input-field"
                      placeholder="0"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block">Category</label>
                    <select
                      className="select-field"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as any }))}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Paid By *</label>
                  <select
                    className="select-field"
                    value={form.paid_by}
                    onChange={(e) => setForm((f) => ({ ...f, paid_by: e.target.value }))}
                  >
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {getMemberName(m.user_id)}
                        {m.user_id === user?.id ? " (You)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Split Among * ({form.split_among.length} selected)
                  </label>
                  <div className="space-y-2">
                    {members.map((m) => (
                      <label
                        key={m.user_id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          form.split_among.includes(m.user_id)
                            ? "border-brand-500/40 bg-brand-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={form.split_among.includes(m.user_id)}
                          onChange={() => toggleSplitMember(m.user_id)}
                        />
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                          form.split_among.includes(m.user_id) ? "bg-brand-500 border-brand-500" : "border-white/30"
                        }`}>
                          {form.split_among.includes(m.user_id) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="avatar w-7 h-7 text-xs flex-shrink-0">
                          {getMemberName(m.user_id)[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm">{getMemberName(m.user_id)}</span>
                        {m.user_id === user?.id && (
                          <span className="text-xs text-white/30 ml-auto">(You)</span>
                        )}
                      </label>
                    ))}
                  </div>
                  {form.split_among.length > 0 && form.amount && (
                    <div className="mt-2 text-sm text-emerald-400 text-center">
                      Each pays: {formatCurrency(parseFloat(form.amount) / form.split_among.length)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Note (optional)</label>
                  <input
                    className="input-field"
                    placeholder="Any additional notes..."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>

                {formError && (
                  <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                    {formError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-6 border-t border-white/8">
                <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex-1"
                  id="save-expense-btn"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Expense"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

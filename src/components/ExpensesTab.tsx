"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  X,
  Loader2,
  ReceiptText,
  Trash2,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  formatCurrency,
  autoCategorize,
  getCategoryIcon,
} from "@/lib/utils";
import { format } from "date-fns";
import { AppUser } from "@/lib/types";
import AutoDetectExpense from "@/components/AutoDetectExpense";
import { logExpenseAndNotify, deleteExpenseAndCleanup } from "@/lib/finance";
import toast from "react-hot-toast";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

    // Real-time (channel name preserved)
    const channel = supabase
      .channel(`expenses-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `trip_id=eq.${tripId}` },
        () => {
          fetchExpenses();
          onExpenseChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, fetchExpenses, onExpenseChange]);

  // ESC closes the delete confirmation modal (but not while a delete is in
  // flight — we don't want a stray keypress to abandon a half-finished op).
  useEffect(() => {
    if (!confirmDeleteId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setConfirmDeleteId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmDeleteId, deleting]);

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

      await logExpenseAndNotify({
        tripId,
        payerId: form.paid_by,
        splitAmong: form.split_among,
        amount: parseFloat(form.amount),
        expenseTitle: form.title,
      });

      // Refresh now instead of waiting for realtime — channel can lag a few
      // seconds, and the user expects their own write to appear immediately.
      await fetchExpenses();
      onExpenseChange();

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

  const performDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await deleteExpenseAndCleanup(tripId, confirmDeleteId);
      await fetchExpenses();
      onExpenseChange();
      toast.success("Expense deleted");
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error("performDelete failed", { expenseId: confirmDeleteId, err });
      toast.error(`Failed to delete expense: ${err?.message ?? err}`);
    } finally {
      setDeleting(false);
    }
  };

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.users?.full_name ?? m?.users?.email?.split("@")[0] ?? "Unknown";
  };

  const getMemberAvatar = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.users?.avatar_url;
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
    <div>
      {/* Category strip */}
      <div className="mb-8">
        <div className="eyebrow mb-3">By category</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-default rounded-lg overflow-hidden border border-subtle">
          {CATEGORIES.map((cat) => {
            const Icon = getCategoryIcon(cat);
            const active = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(active ? "all" : cat)}
                className={`relative bg-elevated p-3 text-left transition-colors ${active ? "" : "hover:bg-overlay"}`}
              >
                {active && (
                  <span
                    className="absolute left-0 right-0 bottom-0 h-0.5 bg-accent"
                    aria-hidden
                  />
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-accent" : "text-ink-muted"}`} strokeWidth={1.75} />
                  <span className={`text-[11px] uppercase tracking-wider font-semibold ${active ? "text-ink" : "text-ink-secondary"}`}>
                    {cat}
                  </span>
                </div>
                <div className="numeric-display tnum text-sm text-ink">
                  {formatCurrency(categoryTotals[cat])}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AutoDetect callout */}
      <AutoDetectExpense onExpenseDetected={handleAutoDetected} />

      {/* Search + Add */}
      <div className="flex items-center gap-2 mb-6 mt-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            className="input-field pl-10"
            placeholder="Search expenses…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary" id="add-expense-btn">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Summary line */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-baseline justify-between text-sm pb-3 border-b border-default">
          <span className="text-ink-muted">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            {filterCategory !== "all" && (
              <span className="ml-2 text-ink-subtle">
                · filtered by <span className="text-ink-secondary capitalize">{filterCategory}</span>
              </span>
            )}
          </span>
          <span className="numeric-display tnum text-ink">
            {formatCurrency(totalFiltered)}
          </span>
        </div>
      )}

      {/* Expense list */}
      {loading ? (
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-14" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <ReceiptText className="w-10 h-10" strokeWidth={1.5} />
          </div>
          <div className="empty-state__title">No expenses yet</div>
          <p className="empty-state__caption">
            {searchQuery
              ? "No expenses match your search."
              : "Log the first one to start the ledger."}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus className="w-3.5 h-3.5" /> Add expense
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--border-subtle)]">
          {filtered.map((expense) => {
            const Icon = getCategoryIcon(expense.category);
            const isCurrentUser = expense.paid_by === user?.id;
            return (
              <li
                key={expense.id}
                className="group py-4 flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-md bg-tint flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-ink-secondary" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-ink truncate text-sm font-medium">{expense.title}</div>
                  <div className="text-[11px] text-ink-muted mt-0.5 flex flex-wrap items-center gap-x-2">
                    <span>
                      {isCurrentUser ? (
                        <span className="text-success">You paid</span>
                      ) : (
                        <>Paid by <span className="text-ink-secondary">{getMemberName(expense.paid_by)}</span></>
                      )}
                    </span>
                    <span className="text-ink-faint">·</span>
                    <span>Split {expense.split_among.length} ways</span>
                    <span className="text-ink-faint">·</span>
                    <span className="capitalize">{expense.category}</span>
                    <span className="text-ink-faint">·</span>
                    <span>{format(new Date(expense.created_at), "MMM d")}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="numeric-display tnum text-base text-ink">
                    {formatCurrency(expense.amount)}
                  </div>
                  <div className="text-[10px] text-ink-faint mt-0.5">
                    {formatCurrency(expense.amount / expense.split_among.length)} each
                  </div>
                </div>
                <button
                  onClick={() => setConfirmDeleteId(expense.id)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 btn-icon text-danger transition-opacity"
                  aria-label={`Delete ${expense.title}`}
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowAdd(false)} className="absolute inset-0 modal-backdrop" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-expense-heading"
            className="relative modal-panel w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-subtle">
              <h3 id="add-expense-heading" className="font-display text-2xl text-ink" style={{ fontWeight: 500 }}>
                Add expense
              </h3>
              <button onClick={() => setShowAdd(false)} className="btn-icon" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
                  Title <span className="text-danger normal-case font-normal tracking-normal">*</span>
                </label>
                <input
                  id="expense-title"
                  className="input-field"
                  placeholder="e.g. Zomato dinner, Uber to hotel…"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
                <p className="text-[11px] text-ink-faint mt-1">Auto-categorizes from common keywords.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
                    Amount <span className="text-danger normal-case font-normal tracking-normal">*</span>
                  </label>
                  <input
                    id="expense-amount"
                    type="number"
                    className="input-field tnum"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
                    Category
                  </label>
                  <select
                    className="select-field capitalize"
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
                <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
                  Paid by <span className="text-danger normal-case font-normal tracking-normal">*</span>
                </label>
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
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle">
                    Split among <span className="text-danger normal-case font-normal tracking-normal">*</span>
                  </label>
                  <span className="text-[11px] text-ink-muted">
                    {form.split_among.length} of {members.length}
                  </span>
                </div>
                <ul className="rounded-lg border border-subtle overflow-hidden divide-y divide-[color:var(--border-subtle)]">
                  {members.map((m) => {
                    const checked = form.split_among.includes(m.user_id);
                    const avatar = getMemberAvatar(m.user_id);
                    const name = getMemberName(m.user_id);
                    return (
                      <li key={m.user_id}>
                        <label
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? "bg-accent-soft" : "hover:bg-tint-soft"}`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={() => toggleSplitMember(m.user_id)}
                          />
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? "bg-accent border-accent" : "border-strong"}`}
                            aria-hidden
                          >
                            {checked && (
                              <svg className="w-2.5 h-2.5 text-[color:var(--accent-on)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          {avatar ? (
                            <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="avatar w-7 h-7 text-[11px] flex-shrink-0">
                              {name[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm text-ink flex-1 truncate">{name}</span>
                          {m.user_id === user?.id && (
                            <span className="text-[10px] text-ink-faint">You</span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {form.split_among.length > 0 && form.amount && (
                  <p className="mt-2 text-xs text-ink-secondary">
                    Each pays{" "}
                    <span className="numeric-display tnum text-ink">
                      {formatCurrency(parseFloat(form.amount) / form.split_among.length)}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
                  Note
                </label>
                <input
                  className="input-field"
                  placeholder="Optional context"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              {formError && (
                <div className="px-4 py-3 rounded-lg border border-danger bg-danger-soft text-danger text-sm">
                  {formError}
                </div>
              )}
            </div>

            <footer className="flex gap-2 px-6 py-4 border-t border-subtle">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1"
                id="save-expense-btn"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save expense"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !deleting && setConfirmDeleteId(null)}
            className="absolute inset-0 modal-backdrop"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-expense-heading"
            className="relative modal-panel w-full max-w-sm"
          >
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-md bg-danger-soft border border-danger flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-danger" strokeWidth={1.75} />
                </div>
                <h3
                  id="delete-expense-heading"
                  className="font-display text-2xl text-ink"
                  style={{ fontWeight: 500 }}
                >
                  Delete expense?
                </h3>
              </div>
              {(() => {
                const target = expenses.find((e) => e.id === confirmDeleteId);
                if (!target) return null;
                const isOwn = target.paid_by === user?.id;
                return (
                  <div className="mb-4 rounded-md border border-subtle bg-tint-soft px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-ink truncate">{target.title}</span>
                      <span className="numeric-display tnum text-sm text-ink flex-shrink-0">
                        {formatCurrency(target.amount)}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-muted mt-1">
                      Paid by {isOwn ? "you" : getMemberName(target.paid_by)}
                    </div>
                  </div>
                );
              })()}
              <p className="text-sm text-ink-muted">
                Removes the expense for everyone and recalculates balances.
                This can&apos;t be undone.
              </p>
            </div>
            <div className="flex gap-2 px-6 pb-5">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                autoFocus
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={performDelete}
                disabled={deleting}
                className="btn-destructive btn-destructive--filled flex-1"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

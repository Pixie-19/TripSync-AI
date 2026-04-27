"use client";

import { useState } from "react";
import {
  Smartphone, X, Zap, CheckCircle, Edit2, AlertCircle,
  Info, ChevronDown, ChevronUp,
} from "lucide-react";
import { parseSMSTransaction, type ParsedTransaction } from "@/lib/smsParser";
import { getCategoryIcon } from "@/lib/utils";

const CATEGORY_OPTIONS = ["food", "transport", "stay", "activities", "shopping", "other"] as const;

const SAMPLE_SMS = [
  "Rs.500 debited from your account to Zomato via UPI. Ref: 123456",
  "INR 1200 paid to Uber via UPI on 26-Apr-2026",
  "Your account has been debited by Rs.3500 at Hotel Taj on 25-Apr-2026",
  "Rs.250 transferred to Swiggy. UPI Ref No: 789012",
];

interface Props {
  onExpenseDetected: (expense: {
    title: string;
    amount: number;
    category: string;
    description: string;
  }) => void;
}

export default function AutoDetectExpense({ onExpenseDetected }: Props) {
  const [open, setOpen] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedCategory, setEditedCategory] = useState<string>("other");
  const [editedAmount, setEditedAmount] = useState("");

  const handleParse = () => {
    setParseError(null);
    const result = parseSMSTransaction(smsText);
    if (!result) {
      setParseError("Could not detect a transaction amount. Try pasting a bank SMS like: Rs.500 paid to Zomato via UPI");
      setParsed(null);
      return;
    }
    setParsed(result);
    setEditedTitle(result.suggestedTitle);
    setEditedCategory(result.suggestedCategory);
    setEditedAmount(String(result.amount));
    setEditMode(false);
  };

  const handleAddExpense = () => {
    if (!parsed) return;
    onExpenseDetected({
      title: editMode ? editedTitle : parsed.suggestedTitle,
      amount: editMode ? parseFloat(editedAmount) || parsed.amount : parsed.amount,
      category: editMode ? editedCategory : parsed.suggestedCategory,
      description: `Auto-detected from: ${parsed.rawText.slice(0, 80)}`,
    });
    setSmsText("");
    setParsed(null);
    setOpen(false);
  };

  const handleSample = (sample: string) => {
    setSmsText(sample);
    const result = parseSMSTransaction(sample);
    if (result) {
      setParsed(result);
      setEditedTitle(result.suggestedTitle);
      setEditedCategory(result.suggestedCategory);
      setEditedAmount(String(result.amount));
      setEditMode(false);
      setParseError(null);
    }
  };

  return (
    <div className="relative">
      {/* Saffron rule above */}
      <div className="flex items-center gap-3 mb-3">
        <span className="h-px flex-1 bg-[color:var(--highlight)] opacity-40" />
        <span className="eyebrow text-highlight">Auto-detect</span>
        <span className="h-px flex-1 bg-[color:var(--highlight)] opacity-40" />
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-subtle bg-highlight-soft hover:bg-highlight-soft-strong text-ink transition-colors text-sm"
        id="auto-detect-toggle"
      >
        <span className="flex items-center gap-2.5 text-left">
          <Smartphone className="w-4 h-4 text-highlight" strokeWidth={1.75} />
          <span>
            <span className="font-medium">Auto-detect from UPI / SMS</span>
            <span className="ml-2 badge badge--saffron">Simulated</span>
          </span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-ink-muted" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
      </button>

      {open && (
        <div className="mt-3 surface-card p-5 space-y-4">
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-info-soft text-xs text-ink-secondary">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-info" />
            <span>
              Simulates the auto-detection used in mobile environments. Paste a bank SMS or UPI notification to auto-fill expense details.
            </span>
          </div>

          <div>
            <p className="eyebrow mb-2">Try a sample</p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_SMS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSample(s)}
                  className="text-xs px-2.5 py-1 rounded-md border border-default text-ink-secondary hover:border-strong hover:text-ink transition-colors"
                >
                  Sample {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block" htmlFor="sms-input">
              Bank SMS or UPI notification
            </label>
            <textarea
              id="sms-input"
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="Rs.500 debited from your account to Zomato via UPI. Ref: 123456"
              rows={3}
              className="textarea-field text-sm"
            />
          </div>

          <button
            onClick={handleParse}
            disabled={!smsText.trim()}
            className="btn-primary w-full"
            id="parse-sms-btn"
          >
            <Zap className="w-3.5 h-3.5" />
            Detect transaction
          </button>

          {parseError && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-md border border-danger bg-danger-soft text-danger text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {parseError}
            </div>
          )}

          {parsed && (
            <div className="rounded-lg border border-success bg-success-soft overflow-hidden">
              <div className="px-4 py-3 border-b border-subtle flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" strokeWidth={1.75} />
                <span className="text-sm font-medium text-ink">Transaction detected</span>
                <span className={`ml-auto badge ${parsed.type === "debit" ? "badge--danger" : "badge--success"}`}>
                  {parsed.type === "debit" ? "Debit" : "Credit"}
                </span>
              </div>

              <div className="px-4 py-4">
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1 block" htmlFor="edit-title">Title</label>
                      <input id="edit-title" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="input-field text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1 block" htmlFor="edit-amount">Amount (INR)</label>
                        <input id="edit-amount" type="number" value={editedAmount} onChange={(e) => setEditedAmount(e.target.value)} className="input-field text-sm tnum" />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1 block" htmlFor="edit-category">Category</label>
                        <select id="edit-category" value={editedCategory} onChange={(e) => setEditedCategory(e.target.value)} className="select-field text-sm capitalize">
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="eyebrow mb-1">Amount</div>
                      <div className="numeric-display tnum text-lg text-ink">
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(parsed.amount)}
                      </div>
                    </div>
                    <div>
                      <div className="eyebrow mb-1">Merchant</div>
                      <div className="text-sm font-medium text-ink truncate">{parsed.merchant}</div>
                    </div>
                    <div>
                      <div className="eyebrow mb-1">Category</div>
                      <div className="inline-flex items-center gap-1.5 text-sm text-ink capitalize">
                        {(() => {
                          const Icon = getCategoryIcon(parsed.suggestedCategory);
                          return <Icon className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />;
                        })()}
                        {parsed.suggestedCategory}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 px-4 pb-4">
                <button
                  onClick={() => setEditMode((v) => !v)}
                  className="btn-secondary flex-1 text-sm"
                  id="edit-detected-btn"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {editMode ? "Preview" : "Edit"}
                </button>
                <button
                  onClick={handleAddExpense}
                  className="btn-primary flex-1 text-sm"
                  id="add-detected-expense-btn"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Add expense
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saffron rule below */}
      <div className="flex items-center gap-3 mt-4">
        <span className="h-px flex-1 bg-[color:var(--highlight)] opacity-40" />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, X, Zap, CheckCircle, Edit2, AlertCircle,
  ArrowRight, Info, ChevronDown, ChevronUp
} from "lucide-react";
import { parseSMSTransaction, type ParsedTransaction } from "@/lib/smsParser";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils";

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
    <div className="mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-brand-500/20 bg-brand-500/5 text-brand-400 hover:bg-brand-500/10 transition-colors text-sm font-medium"
        id="auto-detect-toggle"
      >
        <span className="flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Auto-Detect from UPI / SMS
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300">Simulated</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 glass-card p-5 space-y-4">
              {/* Info Banner */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-brand-500/8 border border-brand-500/20 text-xs text-brand-300">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  This simulates automatic UPI detection used in mobile environments.
                  Paste a bank SMS or UPI notification to auto-fill expense details.
                </span>
              </div>

              {/* Sample SMS Buttons */}
              <div>
                <p className="text-xs text-white/40 mb-2">Try a sample:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_SMS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSample(s)}
                      className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-white/50 hover:border-brand-500/40 hover:text-brand-400 transition-colors"
                    >
                      Sample {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* SMS Input */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5" htmlFor="sms-input">
                  Paste your bank SMS or UPI notification:
                </label>
                <textarea
                  id="sms-input"
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="Rs.500 debited from your account to Zomato via UPI. Ref: 123456"
                  rows={3}
                  className="input-field resize-none text-sm"
                />
              </div>

              <button
                onClick={handleParse}
                disabled={!smsText.trim()}
                className="btn-primary w-full justify-center py-2.5 text-sm"
                id="parse-sms-btn"
              >
                <Zap className="w-4 h-4" />
                Detect Transaction
              </button>

              {/* Parse Error */}
              {parseError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {parseError}
                </div>
              )}

              {/* Parsed Result Preview */}
              <AnimatePresence>
                {parsed && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 text-sm font-semibold">Transaction Detected</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${parsed.type === "debit" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                          {parsed.type === "debit" ? "Debit" : "Credit"}
                        </span>
                      </div>

                      {editMode ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-white/40 mb-1 block" htmlFor="edit-title">Title</label>
                            <input id="edit-title" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="input-field text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-white/40 mb-1 block" htmlFor="edit-amount">Amount (INR)</label>
                              <input id="edit-amount" type="number" value={editedAmount} onChange={(e) => setEditedAmount(e.target.value)} className="input-field text-sm" />
                            </div>
                            <div>
                              <label className="text-xs text-white/40 mb-1 block" htmlFor="edit-category">Category</label>
                              <select id="edit-category" value={editedCategory} onChange={(e) => setEditedCategory(e.target.value)} className="select-field text-sm">
                                {CATEGORY_OPTIONS.map((c) => (
                                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <div className="font-display font-bold text-xl text-white">
                              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(parsed.amount)}
                            </div>
                            <div className="text-white/40 text-xs">Amount</div>
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-white truncate">{parsed.merchant}</div>
                            <div className="text-white/40 text-xs">Merchant</div>
                          </div>
                          <div>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(parsed.suggestedCategory)}`}>
                              {(() => {
                                const Icon = getCategoryIcon(parsed.suggestedCategory);
                                return <Icon className="w-3.5 h-3.5" />;
                              })()}
                              {parsed.suggestedCategory.charAt(0).toUpperCase() + parsed.suggestedCategory.slice(1)}
                            </div>
                            <div className="text-white/40 text-xs mt-1">Category</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        onClick={() => setEditMode((v) => !v)}
                        className="btn-secondary flex-1 justify-center text-sm py-2"
                        id="edit-detected-btn"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        {editMode ? "Preview" : "Edit"}
                      </button>
                      <button
                        onClick={handleAddExpense}
                        className="btn-primary flex-1 justify-center text-sm py-2"
                        id="add-detected-expense-btn"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Add Expense
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

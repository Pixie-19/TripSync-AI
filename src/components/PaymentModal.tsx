"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, CreditCard, Wallet, Loader2, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverName: string;
  amount: number;
  currency?: string;
  onConfirm: () => Promise<void>;
}

const METHODS = [
  { id: "UPI", label: "UPI", caption: "Google Pay, PhonePe, Paytm", icon: Smartphone },
  { id: "Card", label: "Credit / Debit", caption: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "Wallet", label: "Wallet", caption: "Amazon Pay, MobiKwik", icon: Wallet },
] as const;

type Method = typeof METHODS[number]["id"];

export default function PaymentModal({
  isOpen,
  onClose,
  receiverName,
  amount,
  currency = "INR",
  onConfirm,
}: PaymentModalProps) {
  const [method, setMethod] = useState<Method>("UPI");
  const [step, setStep] = useState<"select" | "upi-anim" | "processing" | "success">("select");

  useEffect(() => {
    if (isOpen) {
      setMethod("UPI");
      setStep("select");
    }
  }, [isOpen]);

  // ESC closes when not processing
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step === "select") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, step, onClose]);

  const handlePay = async () => {
    if (method === "UPI") {
      setStep("upi-anim");
      await new Promise((res) => setTimeout(res, 1200));
    }
    setStep("processing");
    await new Promise((res) => setTimeout(res, 1500));
    try {
      await onConfirm();
      setStep("success");
      toast.success("Payment successful");
      setTimeout(() => onClose(), 1400);
    } catch {
      toast.error("Payment failed. Try again.");
      setStep("select");
    }
  };

  if (!isOpen) return null;
  const processing = step !== "select";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={!processing ? onClose : undefined} className="absolute inset-0 modal-backdrop" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-heading"
        className="relative modal-panel w-full max-w-md overflow-hidden"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h3
            id="payment-heading"
            className="font-display text-2xl text-ink"
            style={{ fontWeight: 500 }}
          >
            Make payment
          </h3>
          {!processing && (
            <button onClick={onClose} className="btn-icon" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          )}
        </header>

        <div className="px-6 py-6">
          {/* Amount + receiver */}
          <div className="text-center mb-6">
            <div className="eyebrow mb-2">Paying {receiverName}</div>
            <div
              className="numeric-display tnum text-4xl text-ink"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              {formatCurrency(amount, currency)}
            </div>
          </div>

          {step === "select" && (
            <>
              <ul className="rounded-lg border border-subtle overflow-hidden divide-y divide-[color:var(--border-subtle)] mb-6">
                {METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = method === m.id;
                  return (
                    <li key={m.id}>
                      <button
                        onClick={() => setMethod(m.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${active ? "bg-accent-soft" : "bg-elevated hover:bg-overlay"}`}
                      >
                        <span
                          className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${active ? "bg-accent text-[color:var(--accent-on)]" : "bg-tint text-ink-muted"}`}
                        >
                          <Icon className="w-4 h-4" strokeWidth={1.75} />
                        </span>
                        <div className="flex-1">
                          <div className="text-sm text-ink font-medium">{m.label}</div>
                          <div className="text-[11px] text-ink-muted">{m.caption}</div>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${active ? "bg-accent border-accent" : "border-strong"}`}
                          aria-hidden
                        >
                          {active && <span className="w-1.5 h-1.5 bg-[color:var(--accent-on)] rounded-full" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button onClick={handlePay} className="btn-primary btn-lg w-full">
                Proceed to pay
              </button>
            </>
          )}

          {step === "upi-anim" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-accent-soft border border-accent-soft flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-accent" strokeWidth={1.5} />
              </div>
              <div className="text-base text-ink">Opening UPI app…</div>
              <div className="text-xs text-ink-muted">Don&apos;t close this window</div>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="w-9 h-9 text-accent animate-spin" />
              <div className="text-base text-ink">Processing payment…</div>
              <div className="text-xs text-ink-muted">Securely completing transaction</div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-success-soft border border-success flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" strokeWidth={1.5} />
              </div>
              <div className="font-display text-2xl text-success" style={{ fontWeight: 500 }}>
                Payment successful
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, CreditCard, Wallet, Loader2, CheckCircle, IndianRupee } from "lucide-react";
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

export default function PaymentModal({
  isOpen,
  onClose,
  receiverName,
  amount,
  currency = "INR",
  onConfirm,
}: PaymentModalProps) {
  const [method, setMethod] = useState<"UPI" | "Card" | "Wallet">("UPI");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"select" | "upi-anim" | "processing" | "success">("select");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMethod("UPI");
      setProcessing(false);
      setStep("select");
    }
  }, [isOpen]);

  const handlePay = async () => {
    setProcessing(true);
    
    if (method === "UPI") {
      setStep("upi-anim");
      await new Promise((res) => setTimeout(res, 1500)); // Simulate UPI opening
    }
    
    setStep("processing");
    await new Promise((res) => setTimeout(res, 2000)); // Simulate network request

    try {
      await onConfirm();
      setStep("success");
      toast.success("Payment successful 🎉");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      toast.error("Payment failed. Try again.");
      setStep("select");
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!processing ? onClose : undefined}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-md bg-dark-800 border border-white/10 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-semibold text-lg">Make Payment</h3>
              {!processing && (
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-white/50" />
                </button>
              )}
            </div>

            <div className="p-6">
              {/* Receiver Info */}
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="text-sm text-white/50 mb-2">Paying {receiverName}</div>
                <div className="text-4xl font-display font-bold text-white mb-1">
                  {formatCurrency(amount, currency)}
                </div>
              </div>

              {step === "select" && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-white/70 mb-2">Select Payment Method</div>
                  
                  <button
                    onClick={() => setMethod("UPI")}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      method === "UPI" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${method === "UPI" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/50"}`}>
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">UPI</div>
                      <div className="text-xs text-white/40">Google Pay, PhonePe, Paytm</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setMethod("Card")}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      method === "Card" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${method === "Card" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/50"}`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Credit/Debit Card</div>
                      <div className="text-xs text-white/40">Visa, Mastercard, RuPay</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setMethod("Wallet")}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      method === "Wallet" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${method === "Wallet" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/50"}`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Wallet</div>
                      <div className="text-xs text-white/40">Amazon Pay, MobiKwik</div>
                    </div>
                  </button>

                  <button
                    onClick={handlePay}
                    disabled={processing}
                    className="w-full mt-6 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all disabled:opacity-50"
                  >
                    Proceed to Pay
                  </button>
                </div>
              )}

              {step === "upi-anim" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center"
                  >
                    <Smartphone className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                  <div className="text-lg font-medium">Opening UPI App...</div>
                  <div className="text-sm text-white/50">Please do not close this window</div>
                  <div className="text-xs text-white/30 font-mono mt-4">fake_upi_id@bank</div>
                </div>
              )}

              {step === "processing" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                  <div className="text-lg font-medium">Processing Payment...</div>
                  <div className="text-sm text-white/50">Securely completing transaction</div>
                </div>
              )}

              {step === "success" && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8 space-y-4"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div className="text-xl font-bold text-emerald-400">Payment Successful!</div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

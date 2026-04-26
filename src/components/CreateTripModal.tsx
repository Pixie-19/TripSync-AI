"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Users, DollarSign, Loader2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateInviteCode } from "@/lib/utils";
import { format, addDays } from "date-fns";

const PREFERENCES = [
  { id: "budget", label: "Budget 💰", desc: "Keep costs low" },
  { id: "luxury", label: "Luxury ✨", desc: "Spare no expense" },
  { id: "food", label: "Foodie 🍜", desc: "Local cuisine focus" },
  { id: "adventure", label: "Adventure 🧗", desc: "Outdoor activities" },
  { id: "culture", label: "Culture 🏛️", desc: "History & art" },
  { id: "nightlife", label: "Nightlife 🎉", desc: "Bars & clubs" },
  { id: "family", label: "Family 👨‍👩‍👧", desc: "Kid-friendly" },
  { id: "nature", label: "Nature 🌿", desc: "Parks & wildlife" },
];

interface Props {
  userId: string;
  onClose: () => void;
  onCreated: (tripId: string) => void;
}

export default function CreateTripModal({ userId, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    destination: "",
    budget: "",
    currency: "INR",
    start_date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    end_date: format(addDays(new Date(), 12), "yyyy-MM-dd"),
    num_people: "4",
    preferences: [] as string[],
  });

  const togglePref = (id: string) => {
    setForm((f) => ({
      ...f,
      preferences: f.preferences.includes(id)
        ? f.preferences.filter((p) => p !== id)
        : [...f.preferences, id],
    }));
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const invite_code = generateInviteCode();
      const { data: trip, error: tripErr } = await supabase
        .from("trips")
        .insert({
          title: form.title,
          destination: form.destination,
          budget: parseFloat(form.budget),
          currency: form.currency,
          start_date: form.start_date,
          end_date: form.end_date,
          num_people: parseInt(form.num_people),
          invite_code,
          created_by: userId,
          preferences: form.preferences,
        })
        .select()
        .single();

      if (tripErr) throw tripErr;

      // Add creator as admin member
      await supabase.from("trip_members").insert({
        trip_id: trip.id,
        user_id: userId,
        role: "admin",
      });

      onCreated(trip.id);
    } catch (e: any) {
      setError(e.message ?? "Failed to create trip");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = form.title && form.destination;
  const isStep2Valid = form.budget && form.start_date && form.end_date && form.num_people;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative glass-card w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/8">
            <div>
              <h2 className="font-display font-bold text-xl">Create New Trip</h2>
              <p className="text-white/40 text-sm mt-0.5">Step {step} of 3</p>
            </div>
            <button onClick={onClose} className="btn-ghost p-2" id="close-create-modal">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1 px-6 pt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? "bg-gradient-to-r from-brand-500 to-violet-500" : "bg-white/10"
                }`}
              />
            ))}
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Trip Title *</label>
                  <input
                    id="trip-title"
                    className="input-field"
                    placeholder="e.g. Goa Summer Blast 🏖️"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Destination *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      id="trip-destination"
                      className="input-field pl-10"
                      placeholder="e.g. Goa, India"
                      value={form.destination}
                      onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block">Start Date *</label>
                    <input
                      id="trip-start-date"
                      type="date"
                      className="input-field"
                      value={form.start_date}
                      onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block">End Date *</label>
                    <input
                      id="trip-end-date"
                      type="date"
                      className="input-field"
                      value={form.end_date}
                      onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block">Budget *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        id="trip-budget"
                        type="number"
                        className="input-field pl-10"
                        placeholder="50000"
                        value={form.budget}
                        onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block">Currency</label>
                    <select
                      className="select-field"
                      value={form.currency}
                      onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    >
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                      <option value="GBP">£ GBP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Number of People *</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      id="trip-num-people"
                      type="number"
                      min="2"
                      max="50"
                      className="input-field pl-10"
                      value={form.num_people}
                      onChange={(e) => setForm((f) => ({ ...f, num_people: e.target.value }))}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-white/50 text-sm mb-4">
                  Select your travel style (optional — helps AI plan better)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PREFERENCES.map((pref) => (
                    <button
                      key={pref.id}
                      onClick={() => togglePref(pref.id)}
                      id={`pref-${pref.id}`}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                        form.preferences.includes(pref.id)
                          ? "border-brand-500/60 bg-brand-500/15 text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/8"
                      }`}
                    >
                      <div className="font-medium text-sm">{pref.label}</div>
                      <div className="text-xs opacity-60">{pref.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/8">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
              className="btn-secondary"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="btn-primary"
                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                id="next-step-btn"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="btn-primary"
                disabled={loading}
                id="create-trip-submit"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Trip</>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

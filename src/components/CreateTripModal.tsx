"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Users, Loader2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateInviteCode } from "@/lib/utils";
import { format, addDays } from "date-fns";

const PREFERENCES = [
  { id: "budget", label: "Budget", desc: "Keep costs low" },
  { id: "luxury", label: "Luxury", desc: "Spare no expense" },
  { id: "food", label: "Foodie", desc: "Local cuisine focus" },
  { id: "adventure", label: "Adventure", desc: "Outdoor activities" },
  { id: "culture", label: "Culture", desc: "History & art" },
  { id: "nightlife", label: "Nightlife", desc: "Bars & clubs" },
  { id: "family", label: "Family", desc: "Kid-friendly" },
  { id: "nature", label: "Nature", desc: "Parks & wildlife" },
];

interface Props {
  userId: string;
  onClose: () => void;
  onCreated: (tripId: string) => void;
}

export default function CreateTripModal({ userId, onClose, onCreated }: Props) {
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const togglePref = (id: string) => {
    setForm((f) => ({
      ...f,
      preferences: f.preferences.includes(id)
        ? f.preferences.filter((p) => p !== id)
        : [...f.preferences, id],
    }));
  };

  const handleCreate = async () => {
    if (!form.title || !form.destination || !form.budget) {
      setError("Please fill the required fields.");
      return;
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 modal-backdrop" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-trip-heading"
        className="relative modal-panel w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 id="create-trip-heading" className="font-display text-2xl text-ink" style={{ fontWeight: 500, fontVariationSettings: "'opsz' 144" }}>
            Create a trip
          </h2>
          <button onClick={onClose} className="btn-icon" id="close-create-modal" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
              Title <span className="text-danger normal-case font-normal tracking-normal">*</span>
            </label>
            <input
              id="trip-title"
              className="input-field"
              placeholder="e.g. Goa Summer Blast"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
              Destination <span className="text-danger normal-case font-normal tracking-normal">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint" strokeWidth={1.75} />
              <input
                id="trip-destination"
                className="input-field pl-9"
                placeholder="e.g. Goa, India"
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
                Start date <span className="text-danger normal-case font-normal tracking-normal">*</span>
              </label>
              <input
                id="trip-start-date"
                type="date"
                className="input-field tnum"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
                End date <span className="text-danger normal-case font-normal tracking-normal">*</span>
              </label>
              <input
                id="trip-end-date"
                type="date"
                className="input-field tnum"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
                Budget <span className="text-danger normal-case font-normal tracking-normal">*</span>
              </label>
              <input
                id="trip-budget"
                type="number"
                className="input-field tnum"
                placeholder="50000"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
                Currency
              </label>
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
            <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
              Number of people <span className="text-danger normal-case font-normal tracking-normal">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint" strokeWidth={1.75} />
              <input
                id="trip-num-people"
                type="number"
                min="2"
                max="50"
                className="input-field pl-9 tnum"
                value={form.num_people}
                onChange={(e) => setForm((f) => ({ ...f, num_people: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-2 block">
              Travel style
              <span className="ml-2 text-[10px] font-normal tracking-normal normal-case text-ink-faint">optional</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PREFERENCES.map((pref) => {
                const active = form.preferences.includes(pref.id);
                return (
                  <button
                    key={pref.id}
                    onClick={() => togglePref(pref.id)}
                    id={`pref-${pref.id}`}
                    className={`text-left rounded-md border px-3 py-2.5 transition-colors ${active ? "border-accent bg-accent-soft" : "border-subtle bg-elevated hover:border-default"}`}
                    type="button"
                  >
                    <div className={`text-sm font-medium ${active ? "text-ink" : "text-ink-secondary"}`}>
                      {pref.label}
                    </div>
                    <div className="text-[11px] text-ink-muted mt-0.5">{pref.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg border border-danger bg-danger-soft text-danger text-sm">
              {error}
            </div>
          )}
        </div>

        <footer className="flex gap-2 px-6 py-4 border-t border-subtle">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="btn-primary flex-1"
            disabled={loading}
            id="create-trip-submit"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Create trip
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

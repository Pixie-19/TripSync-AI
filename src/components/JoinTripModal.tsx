"use client";

import { useEffect, useState } from "react";
import { X, Key, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props {
  userId: string;
  onClose: () => void;
  onJoined: (tripId: string) => void;
}

export default function JoinTripModal({ userId, onClose, onJoined }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { data: trip, error: tripErr } = await supabase
        .from("trips")
        .select("id, title, num_people")
        .eq("invite_code", code.trim().toUpperCase())
        .single();

      if (tripErr || !trip) {
        setError("Invalid invite code. Please check and try again.");
        return;
      }

      const { data: existing } = await supabase
        .from("trip_members")
        .select("id")
        .eq("trip_id", trip.id)
        .eq("user_id", userId)
        .single();

      if (existing) {
        onJoined(trip.id);
        return;
      }

      const { count } = await supabase
        .from("trip_members")
        .select("id", { count: "exact" })
        .eq("trip_id", trip.id);

      if (count !== null && count >= trip.num_people) {
        setError("This trip is already full.");
        return;
      }

      const { error: joinErr } = await supabase.from("trip_members").insert({
        trip_id: trip.id,
        user_id: userId,
        role: "member",
      });

      if (joinErr) throw joinErr;
      onJoined(trip.id);
    } catch (e: any) {
      setError(e.message ?? "Failed to join trip");
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
        aria-labelledby="join-trip-heading"
        className="relative modal-panel w-full max-w-sm"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 id="join-trip-heading" className="font-display text-2xl text-ink" style={{ fontWeight: 500 }}>
            Join a trip
          </h2>
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-4">
          <div className="text-center pt-2">
            <div className="w-14 h-14 rounded-md bg-highlight-soft flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6 text-highlight" strokeWidth={1.5} />
            </div>
            <p className="text-ink-muted text-sm">
              Enter the 8-character invite code from your trip organizer.
            </p>
          </div>

          <input
            id="invite-code-input"
            className="input-field text-center font-mono text-xl tracking-widest uppercase tnum"
            placeholder="XXXXXXXX"
            maxLength={8}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            autoFocus
          />

          {error && (
            <div className="px-4 py-3 rounded-lg border border-danger bg-danger-soft text-danger text-sm text-center">
              {error}
            </div>
          )}
        </div>

        <footer className="flex gap-2 px-6 py-4 border-t border-subtle">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={loading || code.length < 6}
            className="btn-primary flex-1"
            id="join-trip-submit"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join trip"}
          </button>
        </footer>
      </div>
    </div>
  );
}

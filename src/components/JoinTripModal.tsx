"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // Find trip by invite code
      const { data: trip, error: tripErr } = await supabase
        .from("trips")
        .select("id, title, num_people")
        .eq("invite_code", code.trim().toUpperCase())
        .single();

      if (tripErr || !trip) {
        setError("Invalid invite code. Please check and try again.");
        return;
      }

      // Check if already a member
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

      // Check member count
      const { count } = await supabase
        .from("trip_members")
        .select("id", { count: "exact" })
        .eq("trip_id", trip.id);

      if (count !== null && count >= trip.num_people) {
        setError("This trip is already full.");
        return;
      }

      // Join the trip
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative glass-card w-full max-w-sm"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/8">
            <h2 className="font-display font-bold text-xl">Join a Trip</h2>
            <button onClick={onClose} className="btn-ghost p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-brand-400" />
              </div>
              <p className="text-white/50 text-sm">
                Enter the 8-character invite code shared by your trip organizer
              </p>
            </div>

            <input
              id="invite-code-input"
              className="input-field text-center text-2xl font-mono tracking-widest uppercase"
              placeholder="XXXXXXXX"
              maxLength={8}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />

            {error && (
              <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-3 p-6 border-t border-white/8">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleJoin}
              disabled={loading || code.length < 6}
              className="btn-primary flex-1"
              id="join-trip-submit"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Trip"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

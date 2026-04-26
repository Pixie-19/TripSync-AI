"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  ThumbsUp,
  Loader2,
  Trophy,
  Vote as VoteIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { AppUser } from "@/lib/types";

interface Vote {
  id: string;
  title: string;
  options: { text: string; votes: number }[];
  created_by: string;
  created_at: string;
}

interface Props {
  tripId: string;
  user: AppUser | null;
}

export default function VotingTab({ tripId, user }: Props) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", options: ["", ""] });
  const [saving, setSaving] = useState(false);
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});

  const fetchVotes = useCallback(async () => {
    const { data } = await supabase
      .from("votes")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });
    if (data) setVotes(data as Vote[]);
    setLoading(false);
  }, [tripId]);

  const fetchMyVotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("vote_responses")
      .select("vote_id, option_index")
      .eq("user_id", user.id);
    if (data) {
      const map: Record<string, number> = {};
      data.forEach((r: any) => { map[r.vote_id] = r.option_index; });
      setMyVotes(map);
    }
  }, [user]);

  useEffect(() => {
    fetchVotes();
    fetchMyVotes();

    const channel = supabase
      .channel(`votes-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes", filter: `trip_id=eq.${tripId}` }, fetchVotes)
      .on("postgres_changes", { event: "*", schema: "public", table: "vote_responses" }, fetchVotes)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tripId, fetchVotes, fetchMyVotes]);

  const handleCastVote = async (voteId: string, optionIndex: number) => {
    if (!user || myVotes[voteId] !== undefined) return;

    // Save response
    await supabase.from("vote_responses").insert({
      vote_id: voteId,
      user_id: user.id,
      option_index: optionIndex,
    });

    // Update vote count in options JSON
    const vote = votes.find((v) => v.id === voteId);
    if (!vote) return;
    const newOptions = vote.options.map((opt, i) =>
      i === optionIndex ? { ...opt, votes: (opt.votes ?? 0) + 1 } : opt
    );
    await supabase.from("votes").update({ options: newOptions }).eq("id", voteId);

    setMyVotes((m) => ({ ...m, [voteId]: optionIndex }));
    fetchVotes();
  };

  const handleCreateVote = async () => {
    if (!form.title || form.options.filter((o) => o.trim()).length < 2 || !user) return;
    setSaving(true);

    const options = form.options
      .filter((o) => o.trim())
      .map((text) => ({ text, votes: 0 }));

    await supabase.from("votes").insert({
      trip_id: tripId,
      title: form.title,
      options,
      created_by: user.id,
    });

    setShowCreate(false);
    setForm({ title: "", options: ["", ""] });
    fetchVotes();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-xl">Group Voting</h3>
          <p className="text-white/50 text-sm mt-0.5">Vote on activities, restaurants, and plans</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary"
          id="create-vote-btn"
        >
          <Plus className="w-4 h-4" /> New Poll
        </button>
      </div>

      {/* Vote list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="skeleton h-40" />)}
        </div>
      ) : votes.length === 0 ? (
        <div className="glass-card p-6 sm:p-12 text-center">
          <div className="flex justify-center mb-4"><VoteIcon className="w-10 h-10 sm:w-12 sm:h-12 text-brand-400" /></div>
          <h3 className="font-semibold text-base sm:text-lg mb-2">No polls yet</h3>
          <p className="text-white/40 text-xs sm:text-sm">Create a poll to let the group decide!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {votes.map((vote, vi) => {
            const totalVotes = vote.options.reduce((s, o) => s + (o.votes ?? 0), 0);
            const myChoice = myVotes[vote.id];
            const hasVoted = myChoice !== undefined;
            const winnerIdx = vote.options.reduce(
              (maxI, o, i, arr) => (o.votes > arr[maxI].votes ? i : maxI),
              0
            );

            return (
              <motion.div
                key={vote.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: vi * 0.08 }}
                className="glass-card p-4 sm:p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg">{vote.title}</h4>
                    <p className="text-white/40 text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                      {totalVotes} vote{totalVotes !== 1 ? "s" : ""} •{" "}
                      {format(new Date(vote.created_at), "MMM d")}
                    </p>
                  </div>
                  {hasVoted && (
                    <div className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      <ThumbsUp className="w-3 h-3" /> Voted
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {vote.options.map((option, oi) => {
                    const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                    const isWinner = hasVoted && oi === winnerIdx && totalVotes > 0;
                    const isMyChoice = myChoice === oi;

                    return (
                      <button
                        key={oi}
                        onClick={() => !hasVoted && handleCastVote(vote.id, oi)}
                        disabled={hasVoted}
                        id={`vote-${vote.id}-option-${oi}`}
                        className={`w-full text-left rounded-xl border p-3 transition-all duration-200 ${
                          isMyChoice
                            ? "border-brand-500/60 bg-brand-500/15"
                            : hasVoted
                            ? "border-white/8 bg-white/3 cursor-default"
                            : "border-white/10 bg-white/5 hover:border-brand-500/40 hover:bg-brand-500/10 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium flex items-center gap-2">
                            {isWinner && totalVotes > 0 && <Trophy className="w-3 h-3 text-amber-400" />}
                            {option.text}
                          </span>
                          <span className="text-sm text-white/50">
                            {hasVoted ? `${pct}%` : ""}
                          </span>
                        </div>
                        {hasVoted && (
                          <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: oi * 0.1 }}
                              className="h-full rounded-full"
                              style={{
                                background: isMyChoice
                                  ? "linear-gradient(90deg, #0ea5e9, #8b5cf6)"
                                  : "rgba(255,255,255,0.2)",
                              }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {!hasVoted && (
                  <p className="text-center text-xs text-white/30 mt-3">
                    Click an option to vote
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative glass-card w-full max-w-md"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/8">
                <h3 className="font-display font-bold text-lg">Create Poll</h3>
                <button onClick={() => setShowCreate(false)} className="btn-ghost p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Question *</label>
                  <input
                    id="vote-title"
                    className="input-field"
                    placeholder="e.g. Where should we eat tonight?"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Options *</label>
                  <div className="space-y-2">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          className="input-field flex-1"
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const opts = [...form.options];
                            opts[i] = e.target.value;
                            setForm((f) => ({ ...f, options: opts }));
                          }}
                        />
                        {form.options.length > 2 && (
                          <button
                            onClick={() => setForm((f) => ({ ...f, options: f.options.filter((_, j) => j !== i) }))}
                            className="btn-ghost p-2 text-rose-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {form.options.length < 6 && (
                      <button
                        onClick={() => setForm((f) => ({ ...f, options: [...f.options, ""] }))}
                        className="btn-ghost text-sm w-full justify-center border border-dashed border-white/20 py-2 rounded-xl"
                      >
                        <Plus className="w-4 h-4" /> Add Option
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-white/8">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleCreateVote}
                  disabled={saving || !form.title || form.options.filter((o) => o.trim()).length < 2}
                  className="btn-primary flex-1"
                  id="submit-vote-btn"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Poll"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

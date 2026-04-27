"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, X, ThumbsUp, Loader2, Trophy, Vote as VoteIcon } from "lucide-react";
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
      data.forEach((r: any) => {
        map[r.vote_id] = r.option_index;
      });
      setMyVotes(map);
    }
  }, [user]);

  useEffect(() => {
    fetchVotes();
    fetchMyVotes();

    const channel = supabase
      .channel(`votes-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `trip_id=eq.${tripId}` },
        fetchVotes
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "vote_responses" }, fetchVotes)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, fetchVotes, fetchMyVotes]);

  const handleCastVote = async (voteId: string, optionIndex: number) => {
    if (!user || myVotes[voteId] !== undefined) return;

    await supabase.from("vote_responses").insert({
      vote_id: voteId,
      user_id: user.id,
      option_index: optionIndex,
    });

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

    const options = form.options.filter((o) => o.trim()).map((text) => ({ text, votes: 0 }));

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

  // ESC for create modal
  useEffect(() => {
    if (!showCreate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCreate(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCreate]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow-rule mb-2">Group voting</div>
          <h3
            className="font-display text-2xl text-ink"
            style={{ fontWeight: 500, fontVariationSettings: "'opsz' 144" }}
          >
            Decisions, deferred to the group.
          </h3>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" id="create-vote-btn">
          <Plus className="w-3.5 h-3.5" /> New poll
        </button>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
      ) : votes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <VoteIcon className="w-10 h-10" strokeWidth={1.5} />
          </div>
          <div className="empty-state__title">No polls yet</div>
          <p className="empty-state__caption">Create a poll to let the group decide.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-3.5 h-3.5" /> New poll
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {votes.map((vote) => {
            const totalVotes = vote.options.reduce((s, o) => s + (o.votes ?? 0), 0);
            const myChoice = myVotes[vote.id];
            const hasVoted = myChoice !== undefined;
            const winnerIdx = vote.options.reduce(
              (maxI, o, i, arr) => (o.votes > arr[maxI].votes ? i : maxI),
              0
            );

            return (
              <article key={vote.id} className="surface-card p-5">
                <header className="flex items-start justify-between mb-4 gap-4">
                  <div>
                    <h4
                      className="font-display text-lg text-ink"
                      style={{ fontWeight: 500, letterSpacing: "-0.005em" }}
                    >
                      {vote.title}
                    </h4>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                      <span className="mx-1.5 text-ink-faint">·</span>
                      {format(new Date(vote.created_at), "MMM d")}
                    </p>
                  </div>
                  {hasVoted && (
                    <span className="badge badge--success">
                      <ThumbsUp className="w-3 h-3" />
                      Voted
                    </span>
                  )}
                </header>

                <ul className="space-y-2">
                  {vote.options.map((option, oi) => {
                    const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                    const isWinner = hasVoted && oi === winnerIdx && totalVotes > 0;
                    const isMyChoice = myChoice === oi;

                    return (
                      <li key={oi}>
                        <button
                          onClick={() => !hasVoted && handleCastVote(vote.id, oi)}
                          disabled={hasVoted}
                          id={`vote-${vote.id}-option-${oi}`}
                          className={`relative w-full text-left rounded-md border p-3 transition-colors ${
                            isMyChoice
                              ? "border-accent bg-accent-soft"
                              : hasVoted
                              ? "border-subtle bg-elevated cursor-default"
                              : "border-subtle bg-elevated hover:border-default cursor-pointer"
                          }`}
                        >
                          {/* Bar background */}
                          {hasVoted && (
                            <span
                              className={`absolute inset-y-0 left-0 rounded-md ${isMyChoice ? "bg-accent-soft" : "bg-tint-soft"}`}
                              style={{ width: `${pct}%` }}
                              aria-hidden
                            />
                          )}
                          <div className="relative flex items-center justify-between gap-3">
                            <span className="text-sm text-ink flex items-center gap-2">
                              {isWinner && totalVotes > 0 && (
                                <Trophy className="w-3.5 h-3.5 text-highlight" strokeWidth={1.75} />
                              )}
                              {option.text}
                            </span>
                            <span className="text-xs text-ink-secondary tnum">
                              {hasVoted ? `${pct}% · ${option.votes}` : ""}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {!hasVoted && (
                  <p className="text-center text-[11px] text-ink-faint mt-3">Click an option to vote.</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowCreate(false)} className="absolute inset-0 modal-backdrop" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-poll-heading"
            className="relative modal-panel w-full max-w-md"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-subtle">
              <h3 id="create-poll-heading" className="font-display text-2xl text-ink" style={{ fontWeight: 500 }}>
                Create poll
              </h3>
              <button onClick={() => setShowCreate(false)} className="btn-icon" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
                  Question <span className="text-danger normal-case font-normal tracking-normal">*</span>
                </label>
                <input
                  id="vote-title"
                  className="input-field"
                  placeholder="e.g. Where should we eat tonight?"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-ink-subtle mb-1.5 block">
                  Options <span className="text-danger normal-case font-normal tracking-normal">*</span>
                </label>
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
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              options: f.options.filter((_, j) => j !== i),
                            }))
                          }
                          className="btn-icon text-danger"
                          aria-label={`Remove option ${i + 1}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {form.options.length < 6 && (
                    <button
                      onClick={() =>
                        setForm((f) => ({ ...f, options: [...f.options, ""] }))
                      }
                      className="text-xs text-ink-secondary hover:text-ink transition-colors w-full text-left py-2 px-3 border border-dashed border-default rounded-md flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add option
                    </button>
                  )}
                </div>
              </div>
            </div>

            <footer className="flex gap-2 px-6 py-4 border-t border-subtle">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1" autoFocus>
                Cancel
              </button>
              <button
                onClick={handleCreateVote}
                disabled={saving || !form.title || form.options.filter((o) => o.trim()).length < 2}
                className="btn-primary flex-1"
                id="submit-vote-btn"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create poll"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

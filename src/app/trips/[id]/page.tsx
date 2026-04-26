"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Plus,
  Copy,
  Check,
  Brain,
  ReceiptText,
  BarChart3,
  Vote,
  Handshake,
  Loader2,
  Share2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, getDaysCount } from "@/lib/utils";
import { format } from "date-fns";
import ItineraryTab from "@/components/ItineraryTab";
import ExpensesTab from "@/components/ExpensesTab";
import InsightsTab from "@/components/InsightsTab";
import SettlementTab from "@/components/SettlementTab";
import VotingTab from "@/components/VotingTab";
import { useAuth } from "@/lib/AuthContext";
import type { AppUser } from "@/lib/types";

type Tab = "itinerary" | "expenses" | "insights" | "voting" | "settlement";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "itinerary", label: "Itinerary", icon: <MapPin className="w-4 h-4" /> },
  { id: "expenses", label: "Expenses", icon: <ReceiptText className="w-4 h-4" /> },
  { id: "insights", label: "AI Insights", icon: <Brain className="w-4 h-4" /> },
  { id: "voting", label: "Voting", icon: <Vote className="w-4 h-4" /> },
  { id: "settlement", label: "Settle Up", icon: <Handshake className="w-4 h-4" /> },
];

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const { user: firebaseUser, loading: authLoading } = useAuth();

  const [trip, setTrip] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);

  const fetchTrip = useCallback(async () => {
    const { data: tripData } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (tripData) setTrip(tripData);

    const { data: memberData } = await supabase
      .from("trip_members")
      .select("*, users(*)")
      .eq("trip_id", tripId);

    if (memberData) setMembers(memberData);
    setLoading(false);
  }, [tripId]);

  const fetchTotalSpent = useCallback(async () => {
    const { data } = await supabase
      .from("expenses")
      .select("amount")
      .eq("trip_id", tripId);
    if (data) {
      setTotalSpent(data.reduce((s: number, e: any) => s + e.amount, 0));
    }
  }, [tripId]);

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) {
      router.replace("/auth");
      return;
    }

    fetchTrip();
    fetchTotalSpent();

    // Real-time subscription for expenses
    const channel = supabase
      .channel(`trip-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `trip_id=eq.${tripId}` }, () => {
        fetchTotalSpent();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tripId, router, fetchTrip, fetchTotalSpent, authLoading, firebaseUser]);

  // Build a minimal user-like object for child components
  const user: AppUser | null = firebaseUser ? {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    user_metadata: {
      full_name: firebaseUser.displayName,
      avatar_url: firebaseUser.photoURL,
    },
  } : null;

  const copyInviteCode = async () => {
    if (!trip) return;
    await navigator.clipboard.writeText(trip.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🗺️</div>
        <h2 className="font-display font-bold text-2xl">Trip not found</h2>
        <button onClick={() => router.push("/dashboard")} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const days = getDaysCount(trip.start_date, trip.end_date);
  const budgetPercent = Math.min(Math.round((totalSpent / trip.budget) * 100), 100);
  const isOverBudget = totalSpent > trip.budget;

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="glow-orb w-[500px] h-[500px] bg-brand-600/10 top-0 right-0" />
        <div className="glow-orb w-[300px] h-[300px] bg-violet-600/10 bottom-0 left-0" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-ghost p-2"
            id="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold">{trip.title}</span>
          </div>

          <button
            onClick={copyInviteCode}
            className="btn-ghost text-sm gap-2"
            id="copy-invite-btn"
          >
            {copied ? (
              <><Check className="w-4 h-4 text-emerald-400" /> Copied!</>
            ) : (
              <><Copy className="w-4 h-4" /> {trip.invite_code}</>
            )}
          </button>
        </div>
      </nav>

      {/* Trip Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Trip Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                <MapPin className="w-4 h-4 text-brand-400" />
                {trip.destination}
              </div>
              <h1 className="font-display font-black text-3xl mb-1">{trip.title}</h1>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {members.length} / {trip.num_people} members
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 lg:min-w-[400px]">
              <div className="glass-card p-4 text-center border border-brand-500/20">
                <div className="text-brand-400 font-bold text-lg">
                  {formatCurrency(trip.budget)}
                </div>
                <div className="text-white/40 text-xs">Budget</div>
              </div>
              <div className={`glass-card p-4 text-center border ${isOverBudget ? "border-rose-500/30" : "border-emerald-500/20"}`}>
                <div className={`font-bold text-lg ${isOverBudget ? "text-rose-400" : "text-emerald-400"}`}>
                  {formatCurrency(totalSpent)}
                </div>
                <div className="text-white/40 text-xs">Spent</div>
              </div>
              <div className="glass-card p-4 text-center border border-violet-500/20">
                <div className={`font-bold text-lg ${isOverBudget ? "text-rose-400" : "text-violet-400"}`}>
                  {formatCurrency(Math.abs(trip.budget - totalSpent))}
                </div>
                <div className="text-white/40 text-xs">{isOverBudget ? "Over!" : "Left"}</div>
              </div>
            </div>
          </div>

          {/* Budget progress */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>Budget Used</span>
              <span className={isOverBudget ? "text-rose-400 font-semibold" : ""}>{budgetPercent}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${budgetPercent}%`,
                  background: isOverBudget
                    ? "linear-gradient(90deg, #f43f5e, #fb7185)"
                    : undefined,
                }}
              />
            </div>
          </div>

          {/* Members */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-white/40 text-xs">Members:</span>
            <div className="flex -space-x-2">
              {members.slice(0, 8).map((m: any, i) => (
                <div
                  key={m.id}
                  className="tooltip"
                  title={m.users?.full_name ?? m.users?.email ?? "Member"}
                >
                  {m.users?.avatar_url ? (
                    <img
                      src={m.users.avatar_url}
                      alt=""
                      className="w-7 h-7 rounded-full ring-2 ring-dark-900 object-cover"
                      style={{ zIndex: 10 - i }}
                    />
                  ) : (
                    <div
                      className="avatar w-7 h-7 text-xs ring-2 ring-dark-900"
                      style={{ zIndex: 10 - i, background: `hsl(${(i * 60) % 360}, 70%, 50%)` }}
                    >
                      {(m.users?.full_name ?? m.users?.email ?? "?")[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              {members.length > 8 && (
                <div className="w-7 h-7 rounded-full ring-2 ring-dark-900 bg-dark-700 flex items-center justify-center text-xs text-white/60">
                  +{members.length - 8}
                </div>
              )}
            </div>

            {/* Invite code badge */}
            <div className="ml-auto flex items-center gap-2">
              <button onClick={copyInviteCode} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs hover:bg-brand-500/20 transition-colors">
                <Share2 className="w-3 h-3" />
                Invite: {trip.invite_code}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 glass-card rounded-xl mb-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              id={`tab-${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-lg"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "itinerary" && (
            <ItineraryTab trip={trip} user={user} />
          )}
          {activeTab === "expenses" && (
            <ExpensesTab tripId={tripId} members={members} user={user} onExpenseChange={fetchTotalSpent} />
          )}
          {activeTab === "insights" && (
            <InsightsTab tripId={tripId} trip={trip} totalSpent={totalSpent} />
          )}
          {activeTab === "voting" && (
            <VotingTab tripId={tripId} user={user} />
          )}
          {activeTab === "settlement" && (
            <SettlementTab tripId={tripId} members={members} trip={trip} />
          )}
        </motion.div>
      </div>
    </div>
  );
}

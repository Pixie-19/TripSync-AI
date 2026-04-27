"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Copy,
  Check,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, getDaysCount } from "@/lib/utils";
import { format } from "date-fns";
import ItineraryTab from "@/components/ItineraryTab";
import ExpensesTab from "@/components/ExpensesTab";
import InsightsTab from "@/components/InsightsTab";
import SettlementTab from "@/components/SettlementTab";
import VotingTab from "@/components/VotingTab";
import TripChatbot from "@/components/TripChatbot";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import GroupChat from "@/components/GroupChat";
import WeatherWidget from "@/components/WeatherWidget";
import TransactionHistory from "@/components/TransactionHistory";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/useTheme";
import type { AppUser } from "@/lib/types";

type Tab = "itinerary" | "expenses" | "insights" | "voting" | "settlement" | "transactions";

const tabs: { id: Tab; label: string }[] = [
  { id: "itinerary", label: "Itinerary" },
  { id: "expenses", label: "Expenses" },
  { id: "settlement", label: "Settle up" },
  { id: "insights", label: "Insights" },
  { id: "voting", label: "Voting" },
  { id: "transactions", label: "History" },
];

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const { user: authUser, loading: authLoading } = useAuth();
  const { theme, toggle } = useTheme();

  const [trip, setTrip] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [heroImage, setHeroImage] = useState<string | null>(null);

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
    if (!authUser) {
      router.replace("/auth");
      return;
    }

    fetchTrip();
    fetchTotalSpent();

    // Real-time subscription for expenses (channel name preserved)
    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `trip_id=eq.${tripId}` },
        () => {
          fetchTotalSpent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, router, fetchTrip, fetchTotalSpent, authLoading, authUser]);

  // Fetch hero image from Wikipedia
  useEffect(() => {
    if (!trip?.destination) return;
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(trip.destination)}`
        );
        if (!res.ok) throw new Error("no img");
        const data = await res.json();
        if (isMounted) {
          setHeroImage(data.originalimage?.source ?? data.thumbnail?.source ?? "");
        }
      } catch {
        if (isMounted) setHeroImage("");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [trip?.destination]);

  // Build a minimal user-like object for child components
  const user: AppUser | null = authUser
    ? {
        id: authUser.id,
        email: authUser.email ?? "",
        user_metadata: {
          full_name: authUser.user_metadata?.full_name,
          avatar_url: authUser.user_metadata?.avatar_url,
        },
      }
    : null;

  const copyInviteCode = async () => {
    if (!trip) return;
    await navigator.clipboard.writeText(trip.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-4">
        <MapPin className="w-12 h-12 text-ink-faint" strokeWidth={1.5} />
        <h2 className="font-display text-2xl text-ink">Trip not found</h2>
        <button onClick={() => router.push("/dashboard")} className="btn-primary">
          Back to dashboard
        </button>
      </div>
    );
  }

  const days = getDaysCount(trip.start_date, trip.end_date);
  const budgetPercent = Math.min(Math.round((totalSpent / trip.budget) * 100), 100);
  const isOverBudget = totalSpent > trip.budget;

  return (
    <main className="min-h-screen bg-canvas">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-veil border-b border-subtle backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-icon"
            id="back-btn"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-md bg-accent text-[color:var(--accent-on)] flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5" strokeWidth={2.25} />
            </div>
            <span className="font-display text-base text-ink truncate" style={{ fontWeight: 500 }}>
              {trip.title}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={toggle} className="btn-icon" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationsDropdown />
            <button
              onClick={copyInviteCode}
              className="btn-ghost text-xs sm:text-sm"
              id="copy-invite-btn"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span className="hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-mono tracking-widest text-[11px]">
                    {trip.invite_code}
                  </span>
                  <span className="sm:hidden">Invite</span>
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero band */}
      <section className="relative">
        <div className="relative w-full h-[44vh] sm:h-[52vh] overflow-hidden bg-overlay">
          {heroImage === null ? (
            <div className="absolute inset-0 skeleton" />
          ) : heroImage ? (
            <img
              src={heroImage}
              alt={trip.destination}
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.78)" }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-soft-strong), var(--highlight-soft-strong))",
              }}
            />
          )}
          {/* Gradient mask to canvas */}
          <div
            className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, var(--surface-canvas) 95%)",
            }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl w-full mx-auto px-6 pb-10 sm:pb-12">
              <div className="text-[#F5EDDD] mix-blend-difference">
                <div className="eyebrow-rule mb-4" style={{ color: "rgba(245, 237, 221, 0.7)" }}>
                  <span style={{ color: "rgba(245, 237, 221, 0.7)" }}>{trip.destination}</span>
                </div>
              </div>
              <h1
                className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#F5EDDD] max-w-4xl"
                style={{
                  fontWeight: 400,
                  letterSpacing: "-0.025em",
                  fontVariationSettings: "'opsz' 144, 'SOFT' 0",
                  textShadow: "0 2px 16px rgba(0,0,0,0.35)",
                }}
              >
                {trip.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Caption strip */}
        <div className="max-w-7xl mx-auto px-6 -mt-4 relative z-10">
          <div className="bg-elevated border border-subtle rounded-lg shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-px bg-default rounded-lg overflow-hidden">
              <CaptionCell
                label="Dates"
                value={`${format(new Date(trip.start_date), "MMM d")} – ${format(new Date(trip.end_date), "MMM d")}`}
                caption={`${days} ${days === 1 ? "day" : "days"}`}
              />
              <CaptionCell
                label="Members"
                value={`${members.length} / ${trip.num_people}`}
                caption={members.length === trip.num_people ? "full" : "joined"}
              />
              <CaptionCell
                label="Budget"
                value={formatCurrency(trip.budget, trip.currency)}
                caption="agreed"
              />
              <CaptionCell
                label="Spent"
                value={formatCurrency(totalSpent, trip.currency)}
                caption={`${budgetPercent}% used`}
                tone={isOverBudget ? "danger" : undefined}
              />
              <div className="bg-elevated px-5 py-4 col-span-2 md:col-span-4 lg:col-span-1 flex items-center justify-center">
                <button
                  onClick={copyInviteCode}
                  className="invite-code text-xs hover:opacity-90 transition-opacity"
                  aria-label="Copy invite code"
                >
                  {copied ? "Copied!" : trip.invite_code}
                </button>
              </div>
            </div>
            {/* Budget progress hairline */}
            <div className="h-px bg-default" />
            <div className="px-5 py-2.5 flex items-center justify-between gap-4">
              <span className="eyebrow">Budget</span>
              <div className="flex-1 progress-bar max-w-2xl">
                <div
                  className={`progress-fill ${isOverBudget ? "progress-fill--danger" : ""}`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <span className={`text-xs tnum ${isOverBudget ? "text-danger" : "text-ink-secondary"}`}>
                {budgetPercent}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Members + weather */}
      <section className="max-w-7xl mx-auto px-6 mt-8 mb-2 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <span className="eyebrow">Group</span>
          <div className="flex -space-x-2">
            {members.slice(0, 8).map((m: any, i) => (
              <div
                key={m.id}
                title={m.users?.full_name ?? m.users?.email ?? "Member"}
                className="relative"
                style={{ zIndex: 10 - i }}
              >
                {m.users?.avatar_url ? (
                  <img
                    src={m.users.avatar_url}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover avatar-ring"
                  />
                ) : (
                  <div className="avatar w-7 h-7 text-[11px] avatar-ring">
                    {(m.users?.full_name ?? m.users?.email ?? "?")[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {members.length > 8 && (
              <div className="avatar w-7 h-7 text-[10px] avatar-ring bg-tint text-ink-secondary">
                +{members.length - 8}
              </div>
            )}
          </div>
        </div>
        <div className="ml-auto">
          <WeatherWidget destination={trip.destination} />
        </div>
      </section>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="sticky top-16 z-30 bg-veil backdrop-blur-md -mx-6 px-6">
          <div className="tab-track overflow-x-auto no-scrollbar scroll-x-snap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                id={`tab-${tab.id}`}
                className={`tab-item ${activeTab === tab.id ? "tab-item--active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="pt-8 pb-16">
          {activeTab === "itinerary" && <ItineraryTab trip={trip} user={user} />}
          {activeTab === "expenses" && (
            <ExpensesTab
              tripId={tripId}
              members={members}
              user={user}
              onExpenseChange={fetchTotalSpent}
            />
          )}
          {activeTab === "insights" && (
            <InsightsTab
              tripId={tripId}
              trip={trip}
              totalSpent={totalSpent}
              members={members}
            />
          )}
          {activeTab === "transactions" && (
            <TransactionHistory tripId={tripId} members={members} currency={trip.currency} />
          )}
          {activeTab === "voting" && <VotingTab tripId={tripId} user={user} />}
          {activeTab === "settlement" && (
            <SettlementTab tripId={tripId} members={members} trip={trip} />
          )}
        </div>
      </div>

      {/* Spacer for FABs on mobile */}
      <div className="h-32 sm:hidden" />

      {/* Floating: AI Chatbot */}
      {user && <TripChatbot trip={trip} />}

      {/* Floating: Group Chat */}
      {user && (
        <GroupChat
          tripId={tripId}
          currentUserId={user.id}
          currentUserName={user.user_metadata?.full_name ?? user.email}
        />
      )}
    </main>
  );
}

function CaptionCell({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  tone?: "danger";
}) {
  return (
    <div className="bg-elevated px-5 py-4">
      <div className="eyebrow mb-2">{label}</div>
      <div
        className={`numeric-display tnum text-base sm:text-lg leading-tight ${tone === "danger" ? "text-danger" : "text-ink"}`}
      >
        {value}
      </div>
      <div className="text-[11px] text-ink-muted mt-0.5">{caption}</div>
    </div>
  );
}

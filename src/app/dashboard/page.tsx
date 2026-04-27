"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MapPin,
  Calendar,
  LogOut,
  ArrowRight,
  Loader2,
  Key,
  Plane,
  Sun,
  Moon,
  ReceiptText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { signOutEverywhere } from "@/lib/authActions";
import { useTheme } from "@/lib/useTheme";
import { formatCurrency, getDaysCount, getCategoryIcon } from "@/lib/utils";
import { format } from "date-fns";
import CreateTripModal from "@/components/CreateTripModal";
import JoinTripModal from "@/components/JoinTripModal";
import NotificationsDropdown from "@/components/NotificationsDropdown";

interface Trip {
  id: string;
  title: string;
  destination: string;
  budget: number;
  currency: string;
  start_date: string;
  end_date: string;
  num_people: number;
  invite_code: string;
}

interface RecentExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
  trip_id: string;
  trip_title: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggle } = useTheme();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [recent, setRecent] = useState<RecentExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const fetchTrips = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("trip_members")
      .select("trip_id, trips(*)")
      .eq("user_id", userId);

    const list = data ? data.map((d: any) => d.trips).filter(Boolean) as Trip[] : [];
    setTrips(list);

    if (list.length > 0) {
      const tripIds = list.map((t) => t.id);
      const { data: exp } = await supabase
        .from("expenses")
        .select("id, title, amount, category, created_at, trip_id, trips(title)")
        .in("trip_id", tripIds)
        .order("created_at", { ascending: false })
        .limit(5);

      if (exp) {
        setRecent(
          exp.map((e: any) => ({
            id: e.id,
            title: e.title,
            amount: e.amount,
            category: e.category,
            created_at: e.created_at,
            trip_id: e.trip_id,
            trip_title: e.trips?.title ?? "",
          }))
        );
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    fetchTrips(user.id);
  }, [user, authLoading, router, fetchTrips]);

  const handleSignOut = async () => {
    await signOutEverywhere();
    router.replace("/auth");
  };

  const handleTripCreated = (tripId: string) => router.push(`/trips/${tripId}`);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayName =
    user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Traveler";
  const avatarUrl = user.user_metadata?.avatar_url;
  const firstName = displayName.split(" ")[0];

  const totalBudget = trips.reduce((s, t) => s + t.budget, 0);
  const totalPeople = trips.reduce((s, t) => s + t.num_people, 0);
  const today = new Date();

  return (
    <main className="min-h-screen bg-canvas">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-veil border-b border-subtle backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 rounded-md bg-accent text-[color:var(--accent-on)] flex items-center justify-center">
              <MapPin className="w-4 h-4" strokeWidth={2.25} />
            </div>
            <span className="font-display text-lg font-medium tracking-tight text-ink">
              Trip<span className="italic text-accent">Sync</span>
              <span className="text-ink-muted hidden sm:inline"> AI</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="btn-icon"
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationsDropdown />
            <button
              onClick={() => router.push("/profile")}
              className="ml-1 flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-tint transition-colors"
              id="profile-link-btn"
              aria-label="Go to profile"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="avatar w-7 h-7 text-xs">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm text-ink-secondary hidden sm:inline">
                {firstName}
              </span>
            </button>
            <button
              onClick={handleSignOut}
              className="btn-icon"
              aria-label="Sign out"
              id="signout-btn"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
        {/* Greeting strip */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 pb-8 border-b border-subtle">
          <div>
            <div className="eyebrow-rule mb-3">
              {format(today, "EEEE · d MMMM yyyy")}
            </div>
            <h1
              className="font-display text-4xl sm:text-5xl text-ink"
              style={{
                fontWeight: 400,
                letterSpacing: "-0.02em",
                fontVariationSettings: "'opsz' 144, 'SOFT' 0",
              }}
            >
              Welcome back, <span className="italic">{firstName}.</span>
            </h1>
            <p className="text-ink-muted text-sm mt-2 max-w-md">
              Your trips, balances, and the latest activity from the group.
            </p>
          </div>
          <div className="flex gap-2 sm:mb-1">
            <button onClick={() => setShowJoin(true)} className="btn-secondary" id="join-trip-btn">
              <Key className="w-3.5 h-3.5" /> Join trip
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary" id="create-trip-btn">
              <Plus className="w-3.5 h-3.5" /> New trip
            </button>
          </div>
        </header>

        {/* Stats */}
        {trips.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-default rounded-lg overflow-hidden border border-subtle mb-16">
            <StatCell
              label="Trips"
              value={trips.length.toString()}
              caption={trips.length === 1 ? "in your ledger" : "in your ledger"}
            />
            <StatCell
              label="People"
              value={totalPeople.toString()}
              caption="across all trips"
            />
            <StatCell
              label="Total budget"
              value={formatCurrency(totalBudget)}
              caption="combined"
            />
          </section>
        )}

        {/* Trips */}
        <section id="trips" className="scroll-mt-24 mb-20">
          <div className="flex items-baseline justify-between mb-6">
            <h2
              className="font-display text-3xl text-ink"
              style={{ fontWeight: 400, letterSpacing: "-0.015em", fontVariationSettings: "'opsz' 144" }}
            >
              Your trips
            </h2>
            <span className="eyebrow">
              {trips.length} {trips.length === 1 ? "Entry" : "Entries"}
            </span>
          </div>
          <div className="divider-rule mb-6" />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-72 w-full" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="surface-card p-16 text-center">
              <div className="empty-state__icon">
                <Plane className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <h3 className="empty-state__title">No trips yet</h3>
              <p className="empty-state__caption">
                Create your first trip and invite the group to start planning together.
              </p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setShowJoin(true)} className="btn-secondary">
                  Join with code
                </button>
                <button onClick={() => setShowCreate(true)} className="btn-primary">
                  <Plus className="w-3.5 h-3.5" /> Create trip
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip, i) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  index={i}
                  onClick={() => router.push(`/trips/${trip.id}`)}
                />
              ))}
              <button
                onClick={() => setShowCreate(true)}
                className="surface-card p-8 flex flex-col items-center justify-center gap-3 border-dashed border-default hover:border-strong hover:bg-tint-soft transition-colors cursor-pointer min-h-[280px]"
                style={{ borderStyle: "dashed" }}
              >
                <div className="w-12 h-12 rounded-full bg-tint flex items-center justify-center">
                  <Plus className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
                </div>
                <span className="text-sm text-ink-muted font-medium">New trip</span>
              </button>
            </div>
          )}
        </section>

        {/* Recent expenses */}
        <section id="expenses" className="scroll-mt-24">
          <div className="flex items-baseline justify-between mb-6">
            <h2
              className="font-display text-3xl text-ink"
              style={{ fontWeight: 400, letterSpacing: "-0.015em", fontVariationSettings: "'opsz' 144" }}
            >
              Recent expenses
            </h2>
            <span className="eyebrow">{recent.length} of latest</span>
          </div>
          <div className="divider-rule mb-2" />

          {recent.length === 0 ? (
            <div className="py-12 text-center text-ink-muted text-sm">
              {trips.length === 0 ? "Once you have a trip, expenses logged by the group will appear here." : "No expenses logged yet across your trips."}
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--border-subtle)]">
              {recent.map((e) => (
                <li
                  key={e.id}
                  className="py-3.5 flex items-center gap-4 cursor-pointer hover:bg-tint-soft transition-colors -mx-3 px-3 rounded"
                  onClick={() => router.push(`/trips/${e.trip_id}`)}
                >
                  <div className="w-9 h-9 rounded-md bg-tint flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const Icon = getCategoryIcon(e.category);
                      return <Icon className="w-4 h-4 text-ink-secondary" strokeWidth={1.75} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">{e.title}</div>
                    <div className="text-xs text-ink-muted truncate mt-0.5">
                      <span className="text-ink-secondary">{e.trip_title}</span>
                      <span className="mx-1.5 text-ink-faint">·</span>
                      <span className="capitalize">{e.category}</span>
                      <span className="mx-1.5 text-ink-faint">·</span>
                      <span>{format(new Date(e.created_at), "MMM d")}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="numeric-display tnum text-ink text-base">
                      {formatCurrency(e.amount)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {showCreate && (
        <CreateTripModal
          userId={user.id}
          onClose={() => setShowCreate(false)}
          onCreated={handleTripCreated}
        />
      )}
      {showJoin && (
        <JoinTripModal
          userId={user.id}
          onClose={() => setShowJoin(false)}
          onJoined={(id) => router.push(`/trips/${id}`)}
        />
      )}
    </main>
  );
}

function StatCell({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="bg-elevated px-6 py-7">
      <div className="eyebrow mb-3">{label}</div>
      <div
        className="numeric-display text-ink text-3xl sm:text-4xl mb-1"
        style={{ fontVariationSettings: "'opsz' 144" }}
      >
        {value}
      </div>
      <div className="text-xs text-ink-muted">{caption}</div>
    </div>
  );
}

function TripCard({
  trip,
  index,
  onClick,
}: {
  trip: Trip;
  index: number;
  onClick: () => void;
}) {
  const days = getDaysCount(trip.start_date, trip.end_date);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchImage() {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            trip.destination
          )}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (isMounted) {
          setImageUrl(data.thumbnail?.source ?? "");
        }
      } catch {
        if (isMounted) setImageUrl("");
      }
    }
    fetchImage();
    return () => {
      isMounted = false;
    };
  }, [trip.destination]);

  return (
    <button
      onClick={onClick}
      className="surface-card--photo text-left flex flex-col group"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-tint">
        {imageUrl === null ? (
          <div className="absolute inset-0 skeleton" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={trip.destination}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.92)" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: index % 2 === 0
                ? "linear-gradient(135deg, var(--accent-soft), var(--highlight-soft))"
                : "linear-gradient(135deg, var(--highlight-soft), var(--accent-soft))",
            }}
          >
            <MapPin className="w-8 h-8 text-ink-muted" strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="badge badge--neutral bg-elevated/85 backdrop-blur-sm">
            <MapPin className="w-3 h-3" strokeWidth={2} /> {trip.destination}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3
          className="font-display text-xl text-ink mb-2 line-clamp-1"
          style={{ fontWeight: 500, letterSpacing: "-0.01em", fontVariationSettings: "'opsz' 144" }}
        >
          {trip.title}
        </h3>
        <div className="text-xs text-ink-muted mb-4 flex items-center gap-2">
          <Calendar className="w-3 h-3" strokeWidth={1.75} />
          {format(new Date(trip.start_date), "MMM d")} –{" "}
          {format(new Date(trip.end_date), "MMM d, yyyy")}
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col gap-0.5">
            <span className="eyebrow">Budget</span>
            <span className="numeric-display tnum text-ink text-lg">
              {formatCurrency(trip.budget, trip.currency)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span>
              {days} {days === 1 ? "day" : "days"}
            </span>
            <span className="text-ink-faint">·</span>
            <span>
              {trip.num_people} {trip.num_people === 1 ? "person" : "people"}
            </span>
            <ArrowRight
              className="w-3.5 h-3.5 text-ink-secondary group-hover:translate-x-0.5 transition-transform"
              strokeWidth={1.75}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

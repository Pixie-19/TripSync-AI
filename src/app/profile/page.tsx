"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Edit2,
  Save,
  X,
  Loader2,
  Calendar,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/lib/AuthContext";
import { signOutEverywhere } from "@/lib/authActions";
import { useTheme } from "@/lib/useTheme";
import { formatCurrency, getDaysCount } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface TripMini {
  id: string;
  title: string;
  destination: string;
  budget: number;
  currency: string;
  start_date: string;
  end_date: string;
  num_people: number;
}

interface ProfileStats {
  totalTrips: number;
  totalSpent: number;
  totalBudget: number;
  countries: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { theme, toggle } = useTheme();
  const [trips, setTrips] = useState<TripMini[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    totalTrips: 0,
    totalSpent: 0,
    totalBudget: 0,
    countries: [],
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (userId: string) => {
    const { data: tripData } = await supabase
      .from("trip_members")
      .select("trip_id, trips(*)")
      .eq("user_id", userId);

    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("paid_by", userId);

    const tripList: TripMini[] = (tripData ?? [])
      .map((d: any) => d.trips)
      .filter(Boolean);
    setTrips(tripList);

    const totalBudget = tripList.reduce((s, t) => s + t.budget, 0);
    const totalSpent = (expenses ?? []).reduce(
      (s: number, e: any) => s + e.amount,
      0
    );
    const countries = [
      ...new Set(
        tripList
          .map((t) => t.destination?.split(",").pop()?.trim())
          .filter(Boolean) as string[]
      ),
    ];

    setStats({
      totalTrips: tripList.length,
      totalSpent,
      totalBudget,
      countries,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    setDisplayName(user.user_metadata?.full_name ?? "");
    fetchData(user.id);
  }, [user, authLoading, router, fetchData]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Firebase is the source of truth — AuthContext re-reads displayName on
      // next load and re-upserts it to the DB, otherwise the upsert clobbers
      // any DB-only update with the stale Google displayName.
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }
      await supabase
        .from("users")
        .update({ full_name: displayName, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      // Firebase's onAuthStateChanged doesn't fire on profile-only changes,
      // so push the fresh snapshot into AuthContext ourselves — otherwise
      // the dashboard navbar keeps the stale name until a hard reload.
      refreshUser();
      toast.success("Profile updated");
      setEditing(false);
    } catch (e) {
      console.error("profile handleSave failed", { userId: user.id, e });
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const email = user.email ?? "";

  return (
    <main className="min-h-screen bg-canvas">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-veil border-b border-subtle backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-icon"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-display text-base text-ink" style={{ fontWeight: 500 }}>
            My profile
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={toggle} className="btn-icon" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={async () => {
                await signOutEverywhere();
                router.replace("/auth");
              }}
              className="btn-ghost text-xs text-danger"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-12 pb-20 grid lg:grid-cols-12 gap-10">
        {/* Left — Identity */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <div className="flex items-start gap-5 mb-8">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="avatar w-24 h-24 text-3xl flex-shrink-0 rounded-md">
                  {(displayName || email)[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0 mt-1">
                <span className="badge mb-3">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
                {editing ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input-field text-lg"
                      placeholder="Your name"
                      id="profile-name-input"
                      autoFocus
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-icon text-accent"
                      aria-label="Save name"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="btn-icon"
                      aria-label="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <h1
                      className="font-display text-3xl text-ink truncate"
                      style={{ fontWeight: 500, letterSpacing: "-0.015em", fontVariationSettings: "'opsz' 144" }}
                    >
                      {displayName || "Traveler"}
                    </h1>
                    <button
                      onClick={() => setEditing(true)}
                      className="btn-icon"
                      aria-label="Edit name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-ink-muted mt-2">
                  <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span className="truncate">{email}</span>
                </div>
              </div>
            </div>

            {/* Stats — vertical editorial */}
            <div className="space-y-px bg-default rounded-lg overflow-hidden border border-subtle">
              <ProfileStat label="Trips" value={String(stats.totalTrips)} />
              <ProfileStat
                label="Total paid"
                value={formatCurrency(stats.totalSpent)}
              />
              <ProfileStat
                label="Total budget"
                value={formatCurrency(stats.totalBudget)}
              />
              <ProfileStat
                label="Destinations"
                value={String(stats.countries.length || 0)}
              />
            </div>

            {/* Destinations chip list */}
            {stats.countries.length > 0 && (
              <div className="mt-6">
                <div className="eyebrow mb-3">Visited</div>
                <div className="flex flex-wrap gap-1.5">
                  {stats.countries.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-md bg-tint-soft text-xs text-ink-secondary"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right — Trip history */}
        <section className="lg:col-span-7">
          <div className="eyebrow-rule mb-4">Trip log</div>
          <h2
            className="font-display text-3xl text-ink mb-6"
            style={{ fontWeight: 400, letterSpacing: "-0.015em", fontVariationSettings: "'opsz' 144" }}
          >
            Your trips, in order.
          </h2>

          {trips.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <MapPin className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <p className="empty-state__caption">No trips yet — start one from the dashboard.</p>
              <button onClick={() => router.push("/dashboard")} className="btn-primary">
                Go to dashboard
              </button>
            </div>
          ) : (
            <ul className="rounded-lg border border-subtle overflow-hidden divide-y divide-[color:var(--border-subtle)]">
              {trips.map((trip) => {
                const days = getDaysCount(trip.start_date, trip.end_date);
                return (
                  <li key={trip.id}>
                    <button
                      onClick={() => router.push(`/trips/${trip.id}`)}
                      className="w-full text-left bg-elevated hover:bg-overlay px-5 py-4 transition-colors flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 rounded-md bg-tint flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-ink-muted" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-display text-base text-ink truncate"
                          style={{ fontWeight: 500, letterSpacing: "-0.005em" }}
                        >
                          {trip.title}
                        </h3>
                        <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                          <span>{trip.destination}</span>
                          <span className="text-ink-faint">·</span>
                          <Calendar className="w-3 h-3" strokeWidth={1.75} />
                          <span>{format(new Date(trip.start_date), "MMM yyyy")}</span>
                          <span className="text-ink-faint">·</span>
                          <span>{days} {days === 1 ? "day" : "days"}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="numeric-display tnum text-sm text-ink">
                          {formatCurrency(trip.budget, trip.currency)}
                        </div>
                        <div className="text-[10px] text-ink-faint mt-0.5">
                          {trip.num_people} {trip.num_people === 1 ? "person" : "people"}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-elevated px-5 py-3.5 flex items-baseline justify-between">
      <span className="eyebrow">{label}</span>
      <span
        className="numeric-display tnum text-lg text-ink"
        style={{ fontVariationSettings: "'opsz' 144" }}
      >
        {value}
      </span>
    </div>
  );
}

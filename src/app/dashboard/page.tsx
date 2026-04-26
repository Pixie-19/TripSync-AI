"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  MapPin,
  Users,
  Calendar,
  LogOut,
  ArrowRight,
  Loader2,
  Key,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { formatCurrency, generateInviteCode, getDaysCount } from "@/lib/utils";
import { format } from "date-fns";
import CreateTripModal from "@/components/CreateTripModal";
import JoinTripModal from "@/components/JoinTripModal";

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const fetchTrips = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("trip_members")
      .select("trip_id, trips(*)")
      .eq("user_id", userId);

    if (data) {
      setTrips(data.map((d: any) => d.trips).filter(Boolean) as Trip[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    fetchTrips(user.uid);
  }, [user, authLoading, router, fetchTrips]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  const handleTripCreated = (tripId: string) => router.push(`/trips/${tripId}`);

  // Loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.displayName ?? user.email?.split("@")[0] ?? "Traveler";
  const avatarUrl = user.photoURL;

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="glow-orb w-[400px] h-[400px] bg-brand-600/15 top-0 right-0" />
        <div className="glow-orb w-[300px] h-[300px] bg-violet-600/10 bottom-0 left-0" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">
              Trip<span className="gradient-text">Sync</span> AI
            </span>
          </div>

          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/30"
              />
            ) : (
              <div className="avatar w-8 h-8 text-sm">{displayName[0]?.toUpperCase()}</div>
            )}
            <span className="text-sm text-white/70 hidden sm:block">{displayName}</span>
            <button
              onClick={handleSignOut}
              className="btn-ghost text-sm text-white/50"
              id="signout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10"
        >
          <div>
            <h1 className="font-display font-bold text-3xl md:text-4xl mb-1">
              Welcome back, {displayName.split(" ")[0]}! 👋
            </h1>
            <p className="text-white/50">Manage your trips and adventures</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowJoin(true)} className="btn-secondary" id="join-trip-btn">
              <Key className="w-4 h-4" /> Join Trip
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary" id="create-trip-btn">
              <Plus className="w-4 h-4" /> New Trip
            </button>
          </div>
        </motion.div>

        {/* Summary stats */}
        {trips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-10"
          >
            {[
              { icon: <MapPin className="w-5 h-5 text-brand-400" />, value: trips.length, label: "Total Trips", color: "from-brand-500/10 to-brand-600/5 border-brand-500/20" },
              { icon: <Users className="w-5 h-5 text-violet-400" />, value: trips.reduce((s, t) => s + t.num_people, 0), label: "People", color: "from-violet-500/10 to-violet-600/5 border-violet-500/20" },
              { icon: <DollarSign className="w-5 h-5 text-emerald-400" />, value: formatCurrency(trips.reduce((s, t) => s + t.budget, 0)), label: "Total Budget", color: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20" },
            ].map((s) => (
              <div key={s.label} className={`glass-card p-4 bg-gradient-to-br ${s.color} border flex items-center gap-4`}>
                <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center">{s.icon}</div>
                <div>
                  <div className="font-display font-bold text-xl">{s.value}</div>
                  <div className="text-white/50 text-xs">{s.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Trips grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-56 w-full" />)}
          </div>
        ) : trips.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-16 text-center">
            <div className="text-7xl mb-6">✈️</div>
            <h2 className="font-display font-bold text-2xl mb-3">No trips yet!</h2>
            <p className="text-white/50 mb-8 max-w-sm mx-auto">Create your first trip and invite your friends to start planning together.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowJoin(true)} className="btn-secondary">Join with Code</button>
              <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create Trip</button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} onClick={() => router.push(`/trips/${trip.id}`)} />
            ))}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: trips.length * 0.1 }}
              onClick={() => setShowCreate(true)}
              className="glass-card p-8 flex flex-col items-center justify-center gap-3 border-dashed border-white/20 hover:border-brand-500/40 hover:bg-brand-500/5 transition-all duration-300 cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-brand-500/20 flex items-center justify-center transition-colors duration-300">
                <Plus className="w-7 h-7 text-white/30 group-hover:text-brand-400 transition-colors duration-300" />
              </div>
              <span className="text-white/40 group-hover:text-brand-400 font-medium transition-colors duration-300">New Trip</span>
            </motion.button>
          </div>
        )}
      </main>

      {showCreate && (
        <CreateTripModal userId={user.uid} onClose={() => setShowCreate(false)} onCreated={handleTripCreated} />
      )}
      {showJoin && (
        <JoinTripModal userId={user.uid} onClose={() => setShowJoin(false)} onJoined={(id) => router.push(`/trips/${id}`)} />
      )}
    </div>
  );
}

function TripCard({ trip, index, onClick }: { trip: Trip; index: number; onClick: () => void }) {
  const days = getDaysCount(trip.start_date, trip.end_date);
  const emojis = ["🏖️", "🏔️", "🌆", "🗺️", "✈️", "🌴"];
  const emoji = emojis[index % emojis.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="glass-card-hover p-6 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 border border-brand-500/20 flex items-center justify-center text-2xl">{emoji}</div>
        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-brand-400 group-hover:translate-x-1 transition-all duration-200" />
      </div>
      <h3 className="font-display font-semibold text-xl mb-1 group-hover:text-brand-300 transition-colors">{trip.title}</h3>
      <p className="text-white/50 text-sm flex items-center gap-1 mb-4">
        <MapPin className="w-3 h-3" /> {trip.destination}
      </p>
      <div className="divider" />
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-brand-400 font-semibold text-sm">{formatCurrency(trip.budget, trip.currency)}</div>
          <div className="text-white/40 text-xs">Budget</div>
        </div>
        <div>
          <div className="text-violet-400 font-semibold text-sm flex items-center justify-center gap-1"><Users className="w-3 h-3" />{trip.num_people}</div>
          <div className="text-white/40 text-xs">People</div>
        </div>
        <div>
          <div className="text-emerald-400 font-semibold text-sm flex items-center justify-center gap-1"><Calendar className="w-3 h-3" />{days}d</div>
          <div className="text-white/40 text-xs">Duration</div>
        </div>
      </div>
      <div className="mt-4 text-xs text-white/30">
        {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d, yyyy")}
      </div>
    </motion.div>
  );
}

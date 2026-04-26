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
  Plane,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { formatCurrency, generateInviteCode, getDaysCount } from "@/lib/utils";
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
    fetchTrips(user.id);
  }, [user, authLoading, router, fetchTrips]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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

  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Traveler";
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-dark-900 font-sans">
      {/* Cinematic Hero Background */}
      <div className="absolute top-0 left-0 w-full h-[60vh] z-0 pointer-events-none overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=80" 
          alt="Mountain Hero" 
          className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
        />
        {/* Gradient overlay to blend into the deep black background */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/40 via-dark-900/80 to-dark-900" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 pt-6 px-6 max-w-7xl mx-auto mb-12">
        <div className="w-full flex items-center justify-between glass-card rounded-full px-6 py-4 border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Trip<span className="gradient-text">Sync</span> AI</span>
        </div>

          <div className="flex items-center gap-4">
            <NotificationsDropdown />
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity bg-white/5 pr-3 pl-1 py-1 rounded-full border border-white/10"
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
                <div className="avatar w-7 h-7 text-xs">{displayName[0]?.toUpperCase()}</div>
              )}
              <span className="text-sm font-medium text-white/80 hidden sm:block">{displayName.split(" ")[0]}</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
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
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-12 sm:mb-16 mt-6 sm:mt-8"
        >
          <div>
            <h1 className="font-display font-medium text-3xl md:text-[2.75rem] mb-2 md:mb-3 tracking-wider uppercase text-brand-400">
              TIME TO TRAVEL, {displayName.split(" ")[0]}
            </h1>
            <p className="text-white/50 text-sm leading-relaxed max-w-lg">
              Manage your trips and upcoming adventures with seamless AI planning.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 sm:mt-0">
            <button onClick={() => setShowJoin(true)} className="btn-secondary flex-1 sm:flex-none" id="join-trip-btn">
              <Key className="w-4 h-4" /> Join Trip
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex-1 sm:flex-none" id="create-trip-btn">
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
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10"
          >
            {[
              { icon: <MapPin className="w-5 h-5 text-brand-400" />, value: trips.length, label: "Total Trips", color: "from-brand-500/10 to-brand-600/5 border-brand-500/20" },
              { icon: <Users className="w-5 h-5 text-violet-400" />, value: trips.reduce((s, t) => s + t.num_people, 0), label: "People", color: "from-violet-500/10 to-violet-600/5 border-violet-500/20" },
              { icon: <DollarSign className="w-5 h-5 text-emerald-400" />, value: formatCurrency(trips.reduce((s, t) => s + t.budget, 0)), label: "Total Budget", color: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20" },
            ].map((s) => (
              <div key={s.label} className={`glass-card p-4 sm:p-5 bg-gradient-to-br ${s.color} border flex items-center gap-4 sm:gap-5 hover:bg-white/5 transition-colors duration-300`}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-dark-800/80 flex items-center justify-center border border-white/5 shadow-lg flex-shrink-0">{s.icon}</div>
                <div className="min-w-0">
                  <div className="font-display font-medium text-xl sm:text-2xl text-white mb-0.5 truncate">{s.value}</div>
                  <div className="text-white/40 text-[9px] sm:text-[10px] font-medium tracking-widest uppercase truncate">{s.label}</div>
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
            <div className="flex justify-center mb-6"><Plane className="w-16 h-16 text-brand-400" /></div>
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
        <CreateTripModal userId={user.id} onClose={() => setShowCreate(false)} onCreated={handleTripCreated} />
      )}
      {showJoin && (
        <JoinTripModal userId={user.id} onClose={() => setShowJoin(false)} onJoined={(id) => router.push(`/trips/${id}`)} />
      )}
    </div>
  );
}

function TripCard({ trip, index, onClick }: { trip: Trip; index: number; onClick: () => void }) {
  const days = getDaysCount(trip.start_date, trip.end_date);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchImage() {
      try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(trip.destination)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (isMounted) {
          if (data.thumbnail && data.thumbnail.source) {
            setImageUrl(data.thumbnail.source);
          } else {
            setImageUrl('');
          }
        }
      } catch (e) {
        if (isMounted) setImageUrl('');
      }
    }
    fetchImage();
    return () => { isMounted = false; };
  }, [trip.destination]);

  // Use a deterministic gradient if no image is found
  const gradients = [
    "from-brand-500/40 to-violet-500/40",
    "from-emerald-500/40 to-brand-500/40",
    "from-amber-500/40 to-rose-500/40",
    "from-violet-500/40 to-rose-500/40",
  ];
  const fallbackGradient = gradients[index % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="glass-card rounded-[1.5rem] p-3 cursor-pointer group bg-[#161B22]/80 border border-white/10 hover:border-white/20 hover:bg-[#161B22] transition-all duration-300 shadow-xl"
    >
      <div className="relative w-full h-40 mb-4 overflow-hidden rounded-[1rem]">
        {imageUrl === null ? (
          <div className="w-full h-full bg-white/5 animate-pulse" />
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt={trip.destination} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient} group-hover:scale-105 transition-transform duration-700`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16]/90 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="text-white/80 text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {trip.destination}
          </div>
          <div className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-medium text-white flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> LIVE
          </div>
        </div>
      </div>
      
      <div className="px-2 pb-2">
        <h3 className="font-medium text-lg mb-2 group-hover:text-white transition-colors">{trip.title}</h3>
        
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] text-white/60">{days} Days</span>
          <span className="px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] text-white/60">{trip.num_people} People</span>
          <span className="px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] text-white/60 font-semibold">{formatCurrency(trip.budget, trip.currency)}</span>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-medium hover:bg-white/10 transition-colors">
            View Details
          </button>
          <button className="w-9 h-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowRight className="w-3 h-3 text-white/70 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

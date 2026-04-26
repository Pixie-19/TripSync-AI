"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Mail, MapPin, DollarSign, Edit2, Save, X,
  Loader2, Camera, Calendar, TrendingUp, ShieldCheck
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface ProfileStats {
  totalTrips: number;
  totalSpent: number;
  totalBudget: number;
  countries: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({ totalTrips: 0, totalSpent: 0, totalBudget: 0, countries: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchStats = useCallback(async (userId: string) => {
    const { data: trips } = await supabase
      .from("trip_members")
      .select("trip_id, trips(budget, destination, currency)")
      .eq("user_id", userId);

    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("paid_by", userId);

    const totalBudget = (trips ?? []).reduce((s: number, t: any) => s + (t.trips?.budget ?? 0), 0);
    const totalSpent = (expenses ?? []).reduce((s: number, e: any) => s + e.amount, 0);
    const countries = [...new Set((trips ?? []).map((t: any) => t.trips?.destination?.split(",").pop()?.trim()).filter(Boolean))] as string[];

    setStats({ totalTrips: trips?.length ?? 0, totalSpent, totalBudget, countries });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth"); return; }
    setDisplayName(user.user_metadata?.full_name ?? "");
    fetchStats(user.id);
  }, [user, authLoading, router, fetchStats]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("users").update({ full_name: displayName, updated_at: new Date().toISOString() }).eq("id", user.id);
      await supabase.auth.updateUser({ data: { full_name: displayName } });
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const email = user.email ?? "";

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="fixed inset-0 pointer-events-none">
        <div className="glow-orb w-[400px] h-[400px] bg-brand-600/15 top-0 right-0" />
        <div className="glow-orb w-[300px] h-[300px] bg-violet-600/10 bottom-0 left-0" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost p-2" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-bold">My Profile</span>
          <div className="ml-auto">
            <button
              onClick={async () => { await supabase.auth.signOut(); router.replace("/auth"); }}
              className="btn-ghost text-sm text-rose-400"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-10 space-y-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover ring-4 ring-brand-500/30" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-3xl font-bold">
                  {(displayName || email)[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              {editing ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field text-xl font-bold max-w-xs"
                    placeholder="Your name"
                    id="profile-name-input"
                  />
                  <button onClick={handleSave} disabled={saving} className="btn-primary px-3 py-2" aria-label="Save name">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-ghost px-3 py-2" aria-label="Cancel edit">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                  <h1 className="font-display font-bold text-2xl">{displayName || "Traveler"}</h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    aria-label="Edit name"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 text-white/50 text-sm justify-center sm:justify-start">
                <Mail className="w-4 h-4" />
                {email}
              </div>
              <div className="flex items-center gap-2 text-white/30 text-xs mt-2 justify-center sm:justify-start">
                <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" /> Verified Traveler
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: <MapPin className="w-5 h-5 text-brand-400" />, value: stats.totalTrips, label: "Trips", color: "from-brand-500/10 to-brand-600/5 border-brand-500/20" },
            { icon: <DollarSign className="w-5 h-5 text-rose-400" />, value: formatCurrency(stats.totalSpent), label: "Total Paid", color: "from-rose-500/10 to-rose-600/5 border-rose-500/20" },
            { icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, value: formatCurrency(stats.totalBudget), label: "Total Budget", color: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20" },
            { icon: <Calendar className="w-5 h-5 text-violet-400" />, value: stats.countries.length || "—", label: "Places", color: "from-violet-500/10 to-violet-600/5 border-violet-500/20" },
          ].map((s) => (
            <div key={s.label} className={`glass-card p-5 bg-gradient-to-br ${s.color} border text-center`}>
              <div className="flex justify-center mb-2">{s.icon}</div>
              <div className="font-display font-bold text-xl">{s.value}</div>
              <div className="text-white/50 text-xs">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Destinations Visited */}
        {stats.countries.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-400" /> Destinations
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats.countries.map((c) => (
                <span key={c} className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm">
                  {c}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

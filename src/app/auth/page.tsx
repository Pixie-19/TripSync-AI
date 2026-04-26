"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Mail, Lock, Eye, EyeOff, Loader2, Zap, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // If already signed in → go to dashboard
  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 2000);
    
    // Check Supabase session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        clearTimeout(timer);
        router.replace("/dashboard");
      }
    });

    // Check Firebase session (for Google Login fallback)
    const unsubFirebase = onAuthStateChanged(auth, (user) => {
      if (user) {
        clearTimeout(timer);
        router.replace("/dashboard");
      } else {
        // Only stop checking if neither has a user
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session?.user) setChecking(false);
        });
      }
    });

    return () => { 
      clearTimeout(timer); 
      subscription.unsubscribe();
      unsubFirebase();
    };
  }, [router]);

  // ── Google Sign-In (using Firebase as bridge) ────────
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      // Use Firebase for Google Sign-In since it's already configured
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e.message || "Google sign-in failed.");
      setGoogleLoading(false);
    }
  };

  // ── Email Sign-In / Sign-Up ─────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() }
          }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Convert Firebase error codes to human-readable messages
  function friendlyError(code: string): string {
    const map: Record<string, string> = {
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Try again.",
      "auth/invalid-credential": "Invalid email or password.",
      "auth/email-already-in-use": "An account already exists with this email.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/network-request-failed": "Network error. Check your connection.",
      "auth/popup-blocked": "Popup was blocked. Allow popups for this site.",
    };
    return map[code] ?? "Something went wrong. Please try again.";
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-dark-900 flex items-center justify-center p-6 overflow-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="glow-orb w-[500px] h-[500px] bg-brand-600/20 top-[-100px] left-[-100px]" />
        <div className="glow-orb w-[400px] h-[400px] bg-violet-600/15 bottom-[-100px] right-[-50px]" />
        <div className="glow-orb w-[300px] h-[300px] bg-emerald-600/10 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 mb-4 shadow-glow-blue">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-black text-3xl mb-1">
            Trip<span className="gradient-text">Sync</span> AI
          </h1>
          <p className="text-white/50 text-sm">Plan together. Travel smarter.</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8"
        >
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 glass-card rounded-xl mb-6">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? "bg-gradient-to-r from-brand-600 to-violet-600 text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            id="google-signin-btn"
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 transition-all duration-200 mb-5 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white/60" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
              {googleLoading ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">or with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <label className="text-sm text-white/60 mb-1.5 block">Full Name</label>
                  <input
                    id="signup-name"
                    type="text"
                    className="input-field"
                    placeholder="Riya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-sm text-white/60 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  className="input-field !pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-white/60 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="input-field !pl-10 !pr-10"
                  placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5"
              id="email-auth-submit"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {mode === "signup" ? "Creating account..." : "Signing in..."}</>
              ) : (
                mode === "signup" ? "Create Account" : "Sign In"
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-white/25 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}

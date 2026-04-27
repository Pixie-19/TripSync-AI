"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { signInWithGoogle, auth, getRedirectResult } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  "auth/network-request-failed":
    "Network error. Some ISPs (e.g. Jio) block our auth provider — try mobile data, a different network, or a VPN.",
  "auth/popup-blocked":
    "Popup was blocked. We tried redirect mode — if it didn't work, allow popups for this site and try again.",
  "auth/popup-closed-by-user": "Sign-in cancelled. Please try again.",
  "auth/unauthorized-domain":
    "This domain isn't authorized for Google sign-in. Add it in Firebase Auth settings.",
};

function isNetworkErrorMessage(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("failed to fetch") ||
    lower.includes("load failed") ||
    lower.includes("network request failed") ||
    lower.includes("networkerror") ||
    lower.includes("err_connection") ||
    lower.includes("err_name_not_resolved")
  );
}

function getAuthErrorMessage(e: any): string {
  if (e?.code && FIREBASE_ERROR_MESSAGES[e.code]) {
    return FIREBASE_ERROR_MESSAGES[e.code];
  }
  const message = String(e?.message ?? "");
  if (isNetworkErrorMessage(message)) {
    return "Can't reach the auth server. Some ISPs (e.g. Jio) block our backend — try mobile data, another network, or a VPN.";
  }
  return message || "Something went wrong. Please try again.";
}

export default function AuthPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 2000);

    // If the user just came back from a Google sign-in redirect (popup
    // fallback path on Safari/Mac), Firebase resolves their session here.
    // The onAuthStateChanged listener below then triggers the dashboard
    // navigation. We still call this so any redirect-flow errors surface.
    getRedirectResult(auth).catch((e: any) => {
      setError(getAuthErrorMessage(e));
    });

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        clearTimeout(timer);
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [router]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      // user === null means popup was blocked and we fell back to redirect;
      // the page is already navigating to Google, so don't touch state here.
      if (user) {
        router.replace("/dashboard");
      }
    } catch (e: any) {
      setError(getAuthErrorMessage(e));
      setGoogleLoading(false);
    }
  };

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
          <div className="text-center mb-6">
            <h2 className="font-display font-bold text-xl mb-1">Welcome</h2>
            <p className="text-white/50 text-sm">Sign in or sign up with Google to continue.</p>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            id="google-signin-btn"
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-5 flex items-start gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-white/25 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}

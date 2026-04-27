"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { signInWithGoogle } from "@/lib/firebase";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=80";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigate once AuthContext confirms a user. Load-bearing for the
  // post-signin lag fix: by the time AuthContext sets `user`, it has
  // already written the ts_auth cookie inside the same Firebase
  // listener callback. Watching `user` here (instead of running our
  // own onAuthStateChanged like before) guarantees the cookie is set
  // before middleware sees the /dashboard request, so we never bounce
  // back to /auth and trigger another round of edge redirects.
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      // Navigation handled by the useEffect above once AuthContext
      // picks up the new user — don't router.replace here.
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message || "Google sign-in failed.");
      setGoogleLoading(false);
    }
  };

  // Spinner while AuthContext resolves OR while we have a user but
  // the navigation hasn't fired yet. Only render the sign-in UI once
  // we're confident the visitor is genuinely unauthenticated.
  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-md bg-accent text-[color:var(--accent-on)] flex items-center justify-center">
            <MapPin className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="grid lg:grid-cols-12 min-h-screen">
        {/* Photo column (top on mobile, left on desktop) */}
        <aside className="relative lg:col-span-6 h-[34vh] lg:h-screen overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt="Mountain valley at dawn"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(20,16,12,0.10) 0%, rgba(20,16,12,0.45) 100%)",
            }}
          />
          <div className="relative z-10 h-full flex flex-col justify-between p-6 lg:p-12 text-[#F5EDDD]">
            <div className="inline-flex items-center gap-2.5 self-start">
              <div className="w-8 h-8 rounded-md bg-[#F5EDDD]/95 text-[#16120D] flex items-center justify-center">
                <MapPin className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <span className="font-display text-lg font-medium tracking-tight">
                Trip<span className="italic">Sync</span>
                <span className="opacity-70"> AI</span>
              </span>
            </div>

            <figure className="hidden lg:block max-w-md">
              <p className="font-display italic text-2xl leading-snug" style={{ fontVariationSettings: "'opsz' 144" }}>
                "Plan together. Spend smarter.
                <br />
                Settle clean."
              </p>
              <figcaption className="mt-3 text-xs uppercase tracking-[0.18em] opacity-70">
                — The TripSync ledger
              </figcaption>
            </figure>
          </div>
        </aside>

        {/* Sign-in column */}
        <section className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-16">
          <div className="max-w-md w-full mx-auto lg:mx-0">
            <div className="eyebrow-rule mb-6">Issue No. 01</div>

            <h1 className="font-display text-4xl sm:text-5xl text-ink mb-3" style={{ fontWeight: 400, letterSpacing: "-0.02em", fontVariationSettings: "'opsz' 144, 'SOFT' 0" }}>
              Welcome back,
              <br />
              <span className="italic">traveler.</span>
            </h1>
            <p className="text-ink-muted text-base leading-relaxed mb-10">
              Sign in to pick up where your group left off — itineraries,
              expenses, and the running ledger.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              id="google-signin-btn"
              className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-lg border border-default bg-elevated hover:bg-overlay text-ink font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed press"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-ink-muted" />
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              <span>{googleLoading ? "Signing in…" : "Continue with Google"}</span>
            </button>

            {error && (
              <div className="mt-5 flex items-start gap-2 px-4 py-3 rounded-lg border border-danger bg-danger-soft text-danger text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-subtle text-xs text-ink-subtle leading-relaxed">
              By signing in you agree to our{" "}
              <a href="https://github.com/Pixie-19/TripSync-AI#terms" target="_blank" rel="noopener noreferrer" className="text-ink-secondary underline decoration-dotted hover:text-accent">
                Terms
              </a>
              {" "}and{" "}
              <a href="https://github.com/Pixie-19/TripSync-AI#privacy" target="_blank" rel="noopener noreferrer" className="text-ink-secondary underline decoration-dotted hover:text-accent">
                Privacy Policy
              </a>
              .
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

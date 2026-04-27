"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  Brain,
  CreditCard,
  Zap,
  TrendingUp,
  Users,
  Globe,
  Plane,
  Bot,
  CheckCircle2,
  Compass,
} from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=80";

const features = [
  {
    n: "01",
    icon: Brain,
    title: "AI itinerary generator",
    body:
      "Describe the trip, hand off the planning. A day-by-day plan with cost estimates, ready in seconds.",
  },
  {
    n: "02",
    icon: CreditCard,
    title: "Smart expense splitting",
    body:
      "Auto-categorized expenses, fair splits, and a settlement algorithm that minimizes who pays whom.",
  },
  {
    n: "03",
    icon: Zap,
    title: "Real-time updates",
    body:
      "Everyone sees the same ledger, instantly. No more screenshots, no more end-of-trip arguments.",
  },
  {
    n: "04",
    icon: TrendingUp,
    title: "AI budget notes",
    body:
      "Personalized spending analysis, with concrete suggestions to keep the trip on budget.",
  },
  {
    n: "05",
    icon: Users,
    title: "Group coordination",
    body:
      "Vote on activities, manage shared itineraries, and keep the group aligned without the chat fatigue.",
  },
  {
    n: "06",
    icon: Globe,
    title: "Anywhere, anytime",
    body:
      "Plan from a laptop, log expenses from a phone. The ledger follows the group, not the device.",
  },
];

const steps = [
  { n: "I", title: "Create your trip", body: "Add destination, budget, dates, and invite the group with a code.", icon: Plane },
  { n: "II", title: "Generate AI itinerary", body: "A day-wise plan with places, timings, and cost estimates.", icon: Bot },
  { n: "III", title: "Track expenses", body: "Add expenses on the go. AI categorizes. The split is automatic.", icon: CreditCard },
  { n: "IV", title: "Settle clean", body: "See who owes whom and settle with the fewest possible transactions.", icon: CheckCircle2 },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-canvas">
      {/* Nav */}
      <nav className="border-b border-subtle">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent text-[color:var(--accent-on)] flex items-center justify-center">
              <MapPin className="w-4 h-4" strokeWidth={2.25} />
            </div>
            <span className="font-display text-lg font-medium tracking-tight text-ink">
              Trip<span className="italic text-accent">Sync</span>
              <span className="text-ink-muted hidden sm:inline"> AI</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/auth")} className="btn-ghost text-sm">
              Sign in
            </button>
            <button
              onClick={() => router.push("/auth")}
              className="btn-primary text-sm"
              id="hero-cta-primary"
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Masthead */}
      <header className="relative max-w-7xl mx-auto px-6 pt-14 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 relative z-10">
          <div className="eyebrow-rule mb-6">Issue No. 01 · Spring 2026</div>
          <h1
            className="font-display text-ink leading-[0.95]"
            style={{
              fontWeight: 400,
              letterSpacing: "-0.035em",
              fontSize: "clamp(2.75rem, 7vw, 5.25rem)",
              fontVariationSettings: "'opsz' 144, 'SOFT' 0",
            }}
          >
            Plan together.
            <br />
            <span className="italic">Spend smarter.</span>
            <br />
            Settle clean.
          </h1>

          <div className="divider-rule mt-8 mb-7" />

          <p className="text-ink-secondary text-base sm:text-lg leading-relaxed max-w-xl">
            TripSync AI is the editorial planner for groups. AI itineraries,
            fair expense splits, and a clean ledger — all in real-time, so the
            trip can be about the trip.
          </p>

          <div className="mt-10 flex items-center gap-3">
            <button
              onClick={() => router.push("/auth")}
              className="btn-primary btn-lg"
              style={{ background: "var(--highlight)", color: "#1A1612" }}
            >
              Start a trip
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => router.push("/auth")} className="btn-secondary btn-lg">
              Sign in
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative h-[40vh] lg:h-[60vh]">
          <div className="absolute inset-0 rounded-lg overflow-hidden border border-subtle">
            <img
              src={HERO_IMAGE}
              alt="Mountain valley at dawn"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: "saturate(0.85)" }}
            />
            <div
              className="absolute inset-0 mix-blend-multiply"
              style={{
                background:
                  "linear-gradient(180deg, rgba(247,241,229,0.05) 0%, rgba(247,241,229,0.30) 100%)",
              }}
            />
          </div>
          {/* Saffron rule decoration */}
          <span
            aria-hidden
            className="hidden lg:block absolute -top-8 -left-8 text-[10rem] leading-none font-display text-highlight opacity-25 select-none"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            ¶
          </span>
        </div>
      </header>

      {/* Stat strip */}
      <section className="border-y border-subtle bg-overlay/50">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:divide-x divide-default">
          <div className="sm:px-4 text-center sm:text-left">
            <div className="numeric-display tnum text-3xl text-ink" style={{ fontVariationSettings: "'opsz' 144" }}>
              10×
            </div>
            <div className="text-xs text-ink-muted mt-1">faster planning</div>
          </div>
          <div className="sm:px-4 text-center sm:text-left">
            <div className="numeric-display tnum text-3xl text-ink" style={{ fontVariationSettings: "'opsz' 144" }}>
              ₹0
            </div>
            <div className="text-xs text-ink-muted mt-1">in end-of-trip arguments</div>
          </div>
          <div className="sm:px-4 text-center sm:text-left">
            <div className="numeric-display tnum text-3xl text-ink" style={{ fontVariationSettings: "'opsz' 144" }}>
              100%
            </div>
            <div className="text-xs text-ink-muted mt-1">transparent group ledger</div>
          </div>
        </div>
      </section>

      {/* Features — editorial columns */}
      <section className="max-w-7xl mx-auto px-6 py-20 sm:py-28">
        <div className="mb-14 max-w-3xl">
          <div className="eyebrow-rule mb-3">The case for TripSync</div>
          <h2
            className="font-display text-ink"
            style={{
              fontWeight: 400,
              letterSpacing: "-0.02em",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontVariationSettings: "'opsz' 144",
            }}
          >
            Everything the group needs.
            <br />
            <span className="italic">Nothing it doesn&apos;t.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <article key={f.n} className="relative">
                <div className="serial-numeral text-ink-faint mb-4">{f.n}</div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-accent" strokeWidth={1.75} />
                  <h3
                    className="font-display text-lg text-ink"
                    style={{ fontWeight: 500, letterSpacing: "-0.005em" }}
                  >
                    {f.title}
                  </h3>
                </div>
                <p className="text-sm text-ink-secondary leading-relaxed">{f.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-subtle bg-overlay/30">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-28">
          <div className="mb-12 max-w-3xl">
            <div className="eyebrow-rule mb-3">How it works</div>
            <h2
              className="font-display text-ink"
              style={{
                fontWeight: 400,
                letterSpacing: "-0.02em",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontVariationSettings: "'opsz' 144",
              }}
            >
              Four steps to a clean ledger.
            </h2>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.n} className="relative">
                  <div className="flex items-baseline gap-3 mb-3">
                    <span
                      className="font-display text-ink-faint"
                      style={{
                        fontWeight: 300,
                        fontSize: "1.5rem",
                        letterSpacing: "0.02em",
                        fontVariationSettings: "'opsz' 144",
                      }}
                    >
                      {s.n}
                    </span>
                    <span className="h-px flex-1 bg-default" />
                    <Icon className="w-4 h-4 text-accent" strokeWidth={1.75} />
                  </div>
                  <h3
                    className="font-display text-lg text-ink mb-1.5"
                    style={{ fontWeight: 500, letterSpacing: "-0.005em" }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">{s.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Pull-quote CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 sm:py-32">
        <blockquote className="text-center">
          <p
            className="font-display italic text-ink"
            style={{
              fontWeight: 400,
              letterSpacing: "-0.015em",
              fontSize: "clamp(1.75rem, 4vw, 3rem)",
              lineHeight: 1.2,
              fontVariationSettings: "'opsz' 144",
            }}
          >
            &ldquo;The trip should be about the trip.
            <br />
            Not the spreadsheet.&rdquo;
          </p>
          <span
            aria-hidden
            className="block w-16 h-0.5 bg-highlight mx-auto mt-8"
          />
          <footer className="mt-6 eyebrow text-ink-subtle">
            <Compass className="inline w-3 h-3 mr-2 -translate-y-px" strokeWidth={1.75} />
            The TripSync principle
          </footer>
        </blockquote>

        <div className="mt-12 flex justify-center">
          <button
            onClick={() => router.push("/auth")}
            className="btn-primary btn-lg"
            id="bottom-cta"
          >
            Start a trip free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </main>
  );
}

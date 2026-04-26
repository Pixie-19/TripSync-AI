"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Users,
  Zap,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  CreditCard,
  Brain,
  Plane,
  Bot,
  CheckCircle2,
  Rocket,
  Heart,
  Utensils,
  AlertTriangle,
  Car,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI Itinerary Generator",
    description: "Describe your dream trip and get a full day-wise plan with cost estimates in seconds.",
    color: "from-brand-500/20 to-violet-500/20",
    border: "border-brand-500/30",
    iconColor: "text-brand-400",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Smart Expense Splitting",
    description: "Auto-categorize expenses and split them fairly. Minimize transactions with our algorithm.",
    color: "from-emerald-500/20 to-brand-500/20",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Real-Time Updates",
    description: "Everyone sees expense updates instantly. No more WhatsApp screenshots or manual tallies.",
    color: "from-amber-500/20 to-rose-500/20",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "AI Budget Insights",
    description: "Get personalized spending analysis and actionable suggestions to stay on budget.",
    color: "from-violet-500/20 to-rose-500/20",
    border: "border-violet-500/30",
    iconColor: "text-violet-400",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Group Coordination",
    description: "Vote on activities, manage shared itineraries, and coordinate with your squad effortlessly.",
    color: "from-rose-500/20 to-violet-500/20",
    border: "border-rose-500/30",
    iconColor: "text-rose-400",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Anywhere, Anytime",
    description: "Works across devices. Plan from your laptop, track from your phone.",
    color: "from-brand-500/20 to-emerald-500/20",
    border: "border-brand-500/30",
    iconColor: "text-brand-400",
  },
];

const stats = [
  { value: "10x", label: "Faster Planning" },
  { value: "₹0", label: "Conflicts" },
  { value: "100%", label: "Transparent" },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-dark-900 overflow-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="glow-orb w-[600px] h-[600px] bg-brand-600/20 top-[-200px] left-[-100px]" />
        <div className="glow-orb w-[500px] h-[500px] bg-violet-600/15 top-[200px] right-[-100px]" />
        <div className="glow-orb w-[400px] h-[400px] bg-emerald-600/10 bottom-[100px] left-[200px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">
            Trip<span className="gradient-text">Sync</span> AI
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={() => router.push("/auth")}
            className="btn-ghost text-sm"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/auth")}
            className="btn-primary text-sm"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 text-sm text-brand-300">
            <Zap className="w-4 h-4 text-brand-400" />
            AI-Powered Group Travel – No More Chaos
          </div>

          <h1 className="font-display font-black text-6xl md:text-8xl leading-none mb-6">
            Travel Together,
            <br />
            <span className="gradient-text">Stress Never.</span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            TripSync AI plans your trip, splits your bills, and gives you real-time
            insights — so your group can focus on making memories, not spreadsheets.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push("/auth")}
              className="btn-primary text-base px-8 py-4"
              id="hero-cta-primary"
            >
              Start Planning Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push("/auth")}
              className="btn-secondary text-base px-8 py-4"
              id="hero-cta-demo"
            >
              View Demo
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-12 mt-20"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display font-black text-4xl gradient-text">
                {stat.value}
              </div>
              <div className="text-white/50 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Mock Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20 relative"
        >
          <div className="glass-card p-1 max-w-4xl mx-auto">
            <div className="bg-dark-800 rounded-xl overflow-hidden">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-dark-900">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-white/5 text-white/30 text-xs text-center">
                  app.tripsync.ai/dashboard
                </div>
              </div>

              {/* Fake dashboard */}
              <div className="p-6 grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-4">
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-white/80">Goa Beach Trip</div>
                      <div className="badge bg-emerald-500/20 text-emerald-400">Active</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {["₹45,000", "6 Members", "5 Days"].map((v, i) => (
                        <div key={i} className="glass-card p-3 text-center">
                          <div className="text-sm font-bold text-brand-400">{v}</div>
                          <div className="text-xs text-white/40 mt-0.5">
                            {["Budget", "People", "Duration"][i]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card p-4 space-y-2">
                    <div className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Recent Expenses
                    </div>
                    {[
                      { icon: <Utensils className="w-4 h-4 text-amber-400" />, name: "Zomato Dinner", amt: "₹1,200", color: "text-amber-400" },
                      { icon: <Car className="w-4 h-4 text-brand-400" />, name: "Uber to Beach", amt: "₹340", color: "text-brand-400" },
                      { icon: <Building2 className="w-4 h-4 text-violet-400" />, name: "Hotel Booking", amt: "₹8,500", color: "text-violet-400" },
                    ].map((e, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span>{e.icon}</span>
                          <span className="text-white/70">{e.name}</span>
                        </div>
                        <span className={`text-sm font-semibold ${e.color}`}>{e.amt}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                      Balances
                    </div>
                    {[
                      { name: "Riya", owes: "+₹2,100", pos: true },
                      { name: "Arjun", owes: "-₹850", pos: false },
                      { name: "Priya", owes: "+₹340", pos: true },
                    ].map((m, i) => (
                      <div key={i} className="flex justify-between items-center py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="avatar w-7 h-7 text-xs">{m.name[0]}</div>
                          <span className="text-white/70">{m.name}</span>
                        </div>
                        <span className={m.pos ? "text-emerald-400" : "text-rose-400"}>
                          {m.owes}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="glass-card p-4">
                    <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      AI Insight
                    </div>
                    <div className="text-xs text-amber-400 flex gap-2">
                      <span><AlertTriangle className="w-5 h-5 text-amber-500" /></span>
                      <span>Food spend is 45% of budget. Consider local restaurants to save ₹2,000.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under preview */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-brand-500/10 blur-3xl rounded-full" />
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">
            Everything your group needs
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            From planning to settlement — TripSync handles the chaos so you don't have to.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card-hover p-6 bg-gradient-to-br ${f.color} border ${f.border}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-dark-800 flex items-center justify-center mb-4 ${f.iconColor}`}>
                {f.icon}
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-bold text-4xl mb-4">How it works</h2>
        </motion.div>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-brand-500/50 via-violet-500/50 to-transparent" />
          {[
            { step: "1", title: "Create Your Trip", desc: "Add destination, budget, dates, and invite your friends with a unique code.", icon: <Plane className="w-6 h-6 text-brand-400" /> },
            { step: "2", title: "Generate AI Itinerary", desc: "Our AI builds a day-wise plan with places, timings, and cost estimates.", icon: <Bot className="w-6 h-6 text-violet-400" /> },
            { step: "3", title: "Track Expenses", desc: "Add expenses on the go. AI auto-categorizes them. Everyone sees the split.", icon: <CreditCard className="w-6 h-6 text-emerald-400" /> },
            { step: "4", title: "Settle Up", desc: "See who owes whom and settle with minimal transactions at trip's end.", icon: <CheckCircle2 className="w-6 h-6 text-rose-400" /> },
          ].map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative flex gap-6 pb-10 last:pb-0"
            >
              <div className="relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center font-display font-bold text-lg flex-shrink-0">
                {step.step}
              </div>
              <div className="glass-card flex-1 p-5">
                <div className="mb-3">{step.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-white/50 text-sm">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-12"
          style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(139,92,246,0.08) 100%)" }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-dark-800/80 border border-white/5 flex items-center justify-center shadow-lg">
              <Rocket className="w-10 h-10 text-brand-400" />
            </div>
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl mb-4">
            Your next trip starts here
          </h2>
          <p className="text-white/50 text-lg mb-8">
            Join thousands of groups who travel smarter with TripSync AI.
          </p>
          <button
            onClick={() => router.push("/auth")}
            className="btn-primary text-lg px-10 py-4"
            id="bottom-cta"
          >
            Get Started — It's Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/8 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-white/30 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>TripSync AI © 2025</span>
          </div>
          <div className="flex items-center gap-1.5">
            Built with <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> for Hackathon
          </div>
        </div>
      </footer>
    </main>
  );
}

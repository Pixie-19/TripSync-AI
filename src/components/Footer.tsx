"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Twitter, Github, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      icon: Twitter,
      href: "https://x.com/SealRishita",
      label: "Twitter",
      color: "hover:text-[#1DA1F2]",
      glow: "hover:shadow-[0_0_15px_rgba(29,161,242,0.4)]",
    },
    {
      icon: Github,
      href: "https://github.com/Pixie-19",
      label: "GitHub",
      color: "hover:text-white",
      glow: "hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]",
    },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/in/rishita-seal-0b3234281/",
      label: "LinkedIn",
      color: "hover:text-[#0A66C2]",
      glow: "hover:shadow-[0_0_15px_rgba(10,102,194,0.4)]",
    },
  ];

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Trips", href: "/dashboard#trips" },
    { name: "Expenses", href: "/dashboard#expenses" },
    { name: "Profile", href: "/profile" },
  ];

  const repoUrl = "https://github.com/Pixie-19/TripSync-AI";
  const legalLinks = [
    { name: "Terms", href: `${repoUrl}#terms` },
    { name: "Privacy", href: `${repoUrl}#privacy` },
    { name: "Security", href: `${repoUrl}#security` },
  ];

  return (
    <footer className="relative z-10 overflow-hidden">
      {/* Premium Divider with Glow */}
      <div className="relative h-px w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-brand-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
      </div>

      <div className="bg-dark-950/90 backdrop-blur-xl border-t border-white/5 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start text-center md:text-left">
            
            {/* Left Section: Brand */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-all duration-300">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-xl tracking-tight text-white">
                    Trip<span className="text-brand-400">Sync</span> AI
                  </span>
                </div>
              </Link>
              <p className="text-white/50 text-sm max-w-xs leading-relaxed font-light">
                Plan together. Spend smarter. Settle instantly. The cinematic command center for your group travels.
              </p>
            </div>

            {/* Center Section: Navigation */}
            <div className="flex flex-col items-center gap-6">
              <h4 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Platform</h4>
              <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-white/60 hover:text-brand-400 text-sm font-medium transition-all duration-300 relative group"
                  >
                    {link.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand-400 transition-all duration-300 group-hover:w-full" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Section: Socials */}
            <div className="flex flex-col items-center md:items-end gap-6">
              <h4 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Connect With Us</h4>
              <div className="flex gap-4">
                {socialLinks.map((social, i) => (
                  <motion.a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -5, scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 transition-all duration-300 ${social.color} ${social.glow} hover:bg-white/[0.08] hover:border-white/20`}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-1.5">
              <p className="text-white/30 text-[10px] uppercase tracking-[0.15em] font-medium">
                &copy; {currentYear} TripSync AI &middot; Engineered for adventure
              </p>
              <p className="text-white/15 text-[10px] tracking-wide font-light">
                Built with Next.js, Supabase &amp; a lot of caffeine.
              </p>
            </div>

            <div className="flex items-center gap-6">
              {legalLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-brand-400 text-[10px] uppercase tracking-[0.15em] font-medium transition-colors duration-300 relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand-400 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
              <span className="hidden md:inline-block w-px h-4 bg-white/10" />
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-white/40 hover:text-white hover:border-white/20 hover:bg-white/[0.06] text-[10px] uppercase tracking-[0.15em] font-medium transition-all duration-300"
              >
                <Github className="w-3 h-3" />
                Source
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-32 bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
    </footer>
  );
}

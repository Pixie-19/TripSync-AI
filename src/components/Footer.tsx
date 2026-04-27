"use client";

import Link from "next/link";
import { MapPin, Twitter, Github, Linkedin } from "lucide-react";

const repoUrl = "https://github.com/Pixie-19/TripSync-AI";

const socialLinks = [
  { icon: Twitter, href: "https://x.com/SealRishita", label: "Twitter" },
  { icon: Github, href: "https://github.com/Pixie-19", label: "GitHub" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/rishita-seal-0b3234281/", label: "LinkedIn" },
];

const navLinks = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Trips", href: "/dashboard#trips" },
  { name: "Expenses", href: "/dashboard#expenses" },
  { name: "Profile", href: "/profile" },
];

const legalLinks = [
  { name: "Terms", href: `${repoUrl}#terms` },
  { name: "Privacy", href: `${repoUrl}#privacy` },
  { name: "Security", href: `${repoUrl}#security` },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-canvas border-t border-default mt-20">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-md bg-accent text-[color:var(--accent-on)] flex items-center justify-center">
                <MapPin className="w-4 h-4" strokeWidth={2.25} />
              </div>
              <span className="font-display text-xl font-medium tracking-tight text-ink">
                Trip<span className="italic text-accent">Sync</span>
                <span className="text-ink-muted"> AI</span>
              </span>
            </Link>
            <p className="mt-5 text-ink-muted text-sm leading-relaxed max-w-md">
              Plan together. Spend smarter. Settle clean. An editorial planner for groups —
              AI itineraries, fair splits, and a clean ledger.
            </p>
          </div>

          {/* Nav */}
          <div className="md:col-span-3 md:col-start-7">
            <div className="eyebrow mb-4">Platform</div>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-secondary hover:text-accent transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="md:col-span-3">
            <div className="eyebrow mb-4">Follow</div>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-tint transition-colors"
                >
                  <social.icon className="w-4 h-4" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs text-ink-subtle">
            <span>© {currentYear} TripSync AI</span>
            <span className="hidden sm:inline text-ink-faint">·</span>
            <span className="text-ink-faint">Built with Next.js + Supabase</span>
          </div>
          <div className="flex items-center gap-5">
            {legalLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-ink-subtle hover:text-ink-secondary transition-colors"
              >
                {item.name}
              </a>
            ))}
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-ink-subtle hover:text-ink-secondary transition-colors"
            >
              <Github className="w-3 h-3" />
              Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

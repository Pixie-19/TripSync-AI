import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "TripSync AI – Smart Group Travel Planner",
  description:
    "AI-powered group travel platform. Plan trips, split expenses, and get smart budget insights – all in real-time.",
  keywords: ["travel planner", "group travel", "expense splitting", "AI itinerary", "trip planning"],
  openGraph: {
    title: "TripSync AI",
    description: "AI-powered group travel platform",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-dark-900 text-white antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

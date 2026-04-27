import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/Footer";

const themeBootstrap = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export const metadata: Metadata = {
  title: "TripSync AI – Plan together. Spend smarter.",
  description:
    "An editorial planner for groups: AI itineraries, fair expense splits, and clean settlement — all in real-time.",
  keywords: ["travel planner", "group travel", "expense splitting", "AI itinerary", "trip planning"],
  openGraph: {
    title: "TripSync AI",
    description: "AI-powered group travel planner",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="font-sans antialiased flex flex-col min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          <div className="flex-grow flex flex-col">
            {children}
          </div>
          <Footer />
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--surface-elevated)",
              color: "var(--ink-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
            },
            success: { iconTheme: { primary: "var(--success)", secondary: "var(--surface-elevated)" } },
            error: { iconTheme: { primary: "var(--danger)", secondary: "var(--surface-elevated)" } },
          }}
        />
      </body>
    </html>
  );
}

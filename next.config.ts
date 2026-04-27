/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "openweathermap.org" },
    ],
  },
  // Allow Firebase's signInWithPopup to read window.closed on the auth popup
  // it opens. Without this, modern Chrome's stricter COOP defaults block
  // those reads and floods the console with "Cross-Origin-Opener-Policy
  // policy would block the window.closed call" warnings after login.
  // `same-origin-allow-popups` keeps cross-origin isolation everywhere else
  // while permitting reference back to popups we opened ourselves.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
  // Optional reverse proxy for Supabase. Some Indian ISPs (notably Jio) block
  // *.supabase.co at the network level. To work around it, set:
  //   SUPABASE_DIRECT_URL=https://<project-ref>.supabase.co
  //   NEXT_PUBLIC_SUPABASE_URL=https://<your-app-domain>/sb-proxy
  // Requests will then originate from the app domain (which Jio doesn't block)
  // and be forwarded by Vercel/Next to Supabase.
  async rewrites() {
    const direct = process.env.SUPABASE_DIRECT_URL;
    if (!direct) return [];
    const trimmed = direct.replace(/\/+$/, "");
    return [
      {
        source: "/sb-proxy/:path*",
        destination: `${trimmed}/:path*`,
      },
    ];
  },
};

export default nextConfig;

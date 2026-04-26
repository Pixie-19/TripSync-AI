import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/trips", "/profile"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Firebase auth state is managed client-side; we check for the session cookie
  // Firebase stores auth in IndexedDB (not cookies), so we use a lightweight
  // approach: check for our custom "ts_auth" cookie set by AuthContext
  const authCookie = request.cookies.get("ts_auth");

  if (!authCookie?.value) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/trips/:path*", "/profile/:path*"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/trips", "/profile"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // ts_auth is set by AuthContext on Firebase login. Auth is Google-only
  // since the email/password path was removed; a single cookie source.
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

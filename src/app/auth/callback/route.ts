// This route is no longer needed — auth is handled by Firebase.
// Kept as placeholder to avoid 404 on any stale bookmarks.
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

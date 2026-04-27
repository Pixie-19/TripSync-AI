"use client";

import { supabase } from "./supabase";
import { auth, signOut as firebaseSignOut } from "./firebase";

// Auth comes from two providers (Supabase email/password + Firebase Google).
// signing out of only one leaves a live session on the other — AuthContext
// then re-hydrates the user from the surviving provider and bounces the
// user right back to /dashboard. This helper tears down both providers
// and both middleware cookies so a single call from any sign-out button
// fully logs the user out, regardless of which provider they used.
//
// Promise.allSettled so a network failure on one provider doesn't skip
// the other (e.g. ISP block on Supabase; Firebase signOut still runs).
export async function signOutEverywhere(): Promise<void> {
  await Promise.allSettled([
    supabase.auth.signOut(),
    auth.currentUser ? firebaseSignOut() : Promise.resolve(),
  ]);

  if (typeof document !== "undefined") {
    document.cookie = "sb_auth=; path=/; max-age=0";
    document.cookie = "ts_auth=; path=/; max-age=0";
  }
}

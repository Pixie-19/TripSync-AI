"use client";

import { supabase } from "./supabase";
import { auth, signOut as firebaseSignOut } from "./firebase";

// Auth is Firebase-only as of the Google-only refactor. The Supabase
// signOut is still called defensively in case a stale session lingers
// from the previous dual-auth era — it's a no-op when no session exists.
export async function signOutEverywhere(): Promise<void> {
  const labels = ["supabase.auth.signOut", "firebase.signOut"] as const;
  const results = await Promise.allSettled([
    supabase.auth.signOut(),
    auth.currentUser ? firebaseSignOut() : Promise.resolve(),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.warn(`[signOutEverywhere] ${labels[i]} failed:`, r.reason);
    }
  });

  if (typeof document !== "undefined") {
    document.cookie = "sb_auth=; path=/; max-age=0";
    document.cookie = "ts_auth=; path=/; max-age=0";
  }
}

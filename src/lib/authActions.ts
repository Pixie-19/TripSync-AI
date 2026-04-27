"use client";

import { supabase } from "./supabase";
import { auth, signOut as firebaseSignOut } from "./firebase";

// Auth is Firebase-only as of the Google-only refactor. The Supabase
// signOut is still called defensively in case a stale session lingers
// from the previous dual-auth era — it's a no-op when no session exists.
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

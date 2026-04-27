"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { auth, onAuthStateChanged } from "@/lib/firebase";

// Auth is Firebase-only (Google sign-in). Supabase is still used as a
// database client (anon key), but no longer for authentication. The
// `user` shape here intentionally mirrors the Supabase user shape so
// downstream components that read user.user_metadata, user.email,
// user.id continue to work unchanged.
interface AuthContextType {
  user: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          user_metadata: {
            full_name: firebaseUser.displayName,
            avatar_url: firebaseUser.photoURL,
          },
        });
        setLoading(false);

        // ts_auth is a presence-only cookie middleware uses for redirect
        // UX — it carries the raw Firebase UID, which is forgeable and is
        // not an auth verifier. Real authorization is enforced at the data
        // layer (Firebase ID tokens / Supabase RLS).
        const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `ts_auth=${firebaseUser.uid}; path=/; max-age=86400; SameSite=Lax${secure}`;

        // Mirror the Firebase user into public.users so trip / expense FKs
        // (which reference public.users(id) as TEXT) resolve. Legacy
        // email/password rows with the same email will trip the
        // UNIQUE(email) constraint — log it so a stuck teammate has a
        // debug signal instead of a silently broken dashboard.
        const { error: upsertError } = await supabase.from("users").upsert({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          full_name: firebaseUser.displayName ?? null,
          avatar_url: firebaseUser.photoURL ?? null,
          updated_at: new Date().toISOString(),
        });
        if (upsertError) {
          console.warn("[AuthContext] public.users upsert failed:", upsertError);
        }
      } else {
        document.cookie = "ts_auth=; path=/; max-age=0";
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubFirebase();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

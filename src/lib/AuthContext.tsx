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

        // ts_auth cookie is read by middleware.ts to gate protected routes.
        document.cookie = `ts_auth=${firebaseUser.uid}; path=/; max-age=86400; SameSite=Lax`;

        // Mirror the Firebase user into public.users so trip / expense FKs
        // (which reference public.users(id) as TEXT) resolve. If a row with
        // this email already exists from the legacy email/password era, this
        // upsert will fail silently on the email UNIQUE constraint — those
        // accounts must keep using their old credentials path, which no
        // longer exists. By design per the user's directive: keep old data,
        // do not auto-migrate.
        await supabase.from("users").upsert({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          full_name: firebaseUser.displayName ?? null,
          avatar_url: firebaseUser.photoURL ?? null,
          updated_at: new Date().toISOString(),
        });
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

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { auth, onAuthStateChanged } from "@/lib/firebase";

interface AuthContextType {
  user: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MODULE 3: Session Persistence
    
    // ── 1. Supabase Session ──
    const initSupabase = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
        document.cookie = `sb_auth=${session.access_token}; path=/; max-age=86400; SameSite=Lax`;
      }
    };
    initSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
        document.cookie = `sb_auth=${session.access_token}; path=/; max-age=86400; SameSite=Lax`;
        
        await supabase.from("users").upsert({
          id: session.user.id,
          email: session.user.email ?? "",
          full_name: session.user.user_metadata?.full_name ?? null,
          avatar_url: session.user.user_metadata?.avatar_url ?? null,
          updated_at: new Date().toISOString(),
        });
      } else if (event === 'SIGNED_OUT') {
        document.cookie = "sb_auth=; path=/; max-age=0";
        // Only clear user if Firebase is also signed out
        if (!auth.currentUser) setUser(null);
      }
    });

    // ── 2. Firebase Session (Google Login fallback) ──
    const unsubFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const unifiedUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          user_metadata: {
            full_name: firebaseUser.displayName,
            avatar_url: firebaseUser.photoURL,
          }
        };
        setUser(unifiedUser);
        setLoading(false);
        
        // Set cookie for middleware
        document.cookie = `ts_auth=${firebaseUser.uid}; path=/; max-age=86400; SameSite=Lax`;

        await supabase.from("users").upsert({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          full_name: firebaseUser.displayName ?? null,
          avatar_url: firebaseUser.photoURL ?? null,
          updated_at: new Date().toISOString(),
        });
      } else {
        document.cookie = "ts_auth=; path=/; max-age=0";
        // Only clear user if Supabase is also signed out
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
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

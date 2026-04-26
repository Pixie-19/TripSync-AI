"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, onAuthStateChanged, type User } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => setLoading(false), 4000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(fallbackTimer);
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Set auth cookie for middleware protection
        document.cookie = `ts_auth=${firebaseUser.uid}; path=/; max-age=86400; SameSite=Lax`;

        // Sync Firebase user into Supabase users table
        await supabase.from("users").upsert({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          full_name: firebaseUser.displayName ?? null,
          avatar_url: firebaseUser.photoURL ?? null,
          updated_at: new Date().toISOString(),
        });
      } else {
        // Clear auth cookie on logout
        document.cookie = "ts_auth=; path=/; max-age=0";
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
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

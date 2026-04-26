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
    // Fallback: if Firebase doesn't respond in 4s, unblock the UI
    const fallbackTimer = setTimeout(() => setLoading(false), 4000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(fallbackTimer);
      setUser(firebaseUser);
      setLoading(false);

      // Sync Firebase user into Supabase users table
      if (firebaseUser) {
        await supabase.from("users").upsert({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          full_name: firebaseUser.displayName ?? null,
          avatar_url: firebaseUser.photoURL ?? null,
          updated_at: new Date().toISOString(),
        });
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

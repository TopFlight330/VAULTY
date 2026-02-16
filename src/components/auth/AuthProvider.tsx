"use client";

import { createContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data as Profile | null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        await fetchProfile(newUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

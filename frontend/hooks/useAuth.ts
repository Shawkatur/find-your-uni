"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export interface AuthProfile {
  full_name?: string;
  role?: string;
}

// Guest user shown when no session exists (auth bypass mode)
const GUEST_PROFILE: AuthProfile = { full_name: "Guest", role: "student" };

export function useAuth() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile>(GUEST_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const meta = session.user.user_metadata;
        setProfile({ full_name: meta?.full_name, role: session.user.app_metadata?.role ?? meta?.role });
      } else {
        setProfile(GUEST_PROFILE);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const meta = session.user.user_metadata;
        setProfile({ full_name: meta?.full_name, role: session.user.app_metadata?.role ?? meta?.role });
      } else {
        setProfile(GUEST_PROFILE);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
  }, [supabase, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const role = profile?.role ?? "student";

  return { user, profile, role, loading, signOut };
}

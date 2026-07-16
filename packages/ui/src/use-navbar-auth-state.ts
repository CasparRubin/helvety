"use client";

import { createBrowserClient } from "@helvety/shared/supabase/client";
import { useEffect, useMemo, useState } from "react";

import { getUserSingleflight } from "./auth-session-singleflight";

/**
 * Shared auth-session state for app navbars.
 * Uses server-provided initial user when available, then subscribes to updates.
 */
type NavbarUser = {
  id?: string;
  email?: string | null;
};

/**
 * Returns navbar auth user/loading state with live Supabase session updates.
 *
 * @param initialUser - Optional server-provided user to seed state before probe
 */
export function useNavbarAuthState<UserType extends NavbarUser>(
  initialUser: UserType | null = null
): {
  user: UserType | null;
  isLoading: boolean;
} {
  const [user, setUser] = useState<UserType | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    if (initialUser) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        // Supabase User structurally matches NavbarUser; callers narrow via UserType.
        setUser((session?.user ?? null) as UserType | null);
        setIsLoading(false);
      });
      return () => subscription.unsubscribe();
    }

    const getUser = async () => {
      const {
        data: { user: fetchedUser },
      } = await getUserSingleflight(supabase, { cooldownMs: 1_500 });
      setUser((fetchedUser ?? null) as UserType | null);
      setIsLoading(false);
    };
    void getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((session?.user ?? null) as UserType | null);
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [initialUser, supabase]);

  return { user, isLoading };
}

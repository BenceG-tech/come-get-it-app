import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabaseClient";

type AppContextType = {
  locationEnabled: boolean;
  setLocationEnabled: (enabled: boolean) => void;
  points: number;
  addPoints: (amount: number) => void;
  selectedFilters: string[];
  setSelectedFilters: (filters: string[]) => void;
};

export const [AppProvider, useAppContext] = createContextHook<AppContextType>(() => {
  const { session, isAuthReady } = useAuth();
  const supabase = useMemo(() => getSupabase(), []);

  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [points, setPoints] = useState<number>(0);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!isAuthReady) return;

      if (!session?.user?.id) {
        console.log('[AppContext] No session -> reset points');
        if (mounted) {
          setPoints(0);
        }
        return;
      }

      try {
        console.log('[AppContext] Fetching points from profiles', { userId: session.user.id });
        const { data, error } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;
        const nextPoints = Number((data as { points?: unknown } | null)?.points ?? 0);
        console.log('[AppContext] Points loaded', { points: Number.isFinite(nextPoints) ? nextPoints : 0 });
        if (mounted) setPoints(Number.isFinite(nextPoints) ? nextPoints : 0);
      } catch (e: unknown) {
        let errMsg = 'Unknown error';
        if (e instanceof Error) {
          errMsg = e.message || e.name || 'Error with no message';
        } else if (e && typeof e === 'object') {
          errMsg = JSON.stringify(e, null, 2);
        } else if (e) {
          errMsg = String(e);
        }
        console.warn('[AppContext] Failed to load points, defaulting to 0:', errMsg);
        if (mounted) setPoints(0);
      }
    };

    run().catch((e) => {
      console.error('[AppContext] points effect crashed', e);
    });

    return () => {
      mounted = false;
    };
  }, [isAuthReady, session?.user?.id, supabase]);

  const addPoints = (amount: number) => {
    setPoints((current) => current + amount);
  };

  return {
    locationEnabled,
    setLocationEnabled,
    points,
    addPoints,
    selectedFilters,
    setSelectedFilters,
  };
});
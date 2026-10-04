import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabaseClient';
import { runSupabaseRead } from '@/lib/supabaseRequest';

type AppContextType = {
  locationEnabled: boolean;
  setLocationEnabled: (enabled: boolean) => void;
  points: number;
  pointsLoaded: boolean;
  refreshPoints: () => Promise<void>;
  setPointsBalance: (balance: number) => void;
  selectedFilters: string[];
  setSelectedFilters: (filters: string[]) => void;
};

export const [AppProvider, useAppContext] = createContextHook<AppContextType>(() => {
  const { session, isAuthReady } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const pointsQuery = useQuery({
    queryKey: ['user-points', userId],
    enabled: isAuthReady && Boolean(userId),
    queryFn: async () => {
      const data = await runSupabaseRead<{ balance: number }>('Pontegyenleg betöltése', () =>
        getSupabase().from('user_points').select('balance').eq('user_id', userId!).maybeSingle());
      const balance = Number(data?.balance ?? 0);
      if (!Number.isFinite(balance)) throw new Error('Érvénytelen pontegyenleg.');
      return balance;
    },
    staleTime: 30_000,
    retry: 1,
  });
  const refreshPoints = useCallback(async () => {
    if (userId) await queryClient.invalidateQueries({ queryKey: ['user-points', userId] });
  }, [queryClient, userId]);
  const setPointsBalance = useCallback((balance: number) => {
    if (userId && Number.isFinite(balance)) queryClient.setQueryData(['user-points', userId], balance);
  }, [queryClient, userId]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPoints();
    });
    return () => subscription.remove();
  }, [refreshPoints]);

  return {
    locationEnabled, setLocationEnabled,
    points: userId ? pointsQuery.data ?? 0 : 0,
    pointsLoaded: Boolean(userId) && pointsQuery.isSuccess,
    refreshPoints, setPointsBalance, selectedFilters, setSelectedFilters,
  };
});

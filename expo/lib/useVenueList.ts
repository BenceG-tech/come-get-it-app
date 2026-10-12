import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { Venue } from '@/types/venue';
import { fetchVenues } from '@/lib/venueService';
import { startVenueRefreshLifecycle } from '@/lib/venueRefreshLifecycle';

/** A fresh list on every focus/resume; previous results are only an error fallback. */
export function useVenueList() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offersLoading, setOffersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const loaded = useRef(false);

  const refresh = useCallback(async (manual = false) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(!loaded.current);
    setRefreshing(manual);
    setOffersLoading(true);
    setError(null);
    const display = (rows: Venue[]) => {
      if (controller.signal.aborted) return;
      setVenues(rows); // Replace, including [], so removed venues cannot linger.
      loaded.current = true;
      setLoading(false);
    };
    try {
      display(await fetchVenues({ signal: controller.signal, onBase: display }));
    } catch {
      if (!controller.signal.aborted) setError(loaded.current
        ? 'Nem sikerült frissíteni. A legutóbb betöltött helyszíneket mutatjuk.'
        : 'Nem sikerült betölteni a helyszíneket. Próbáld újra.');
    } finally {
      if (!controller.signal.aborted) { setLoading(false); setRefreshing(false); setOffersLoading(false); }
    }
  }, []);

  useFocusEffect(useCallback(() => startVenueRefreshLifecycle(
    AppState, () => { void refresh(); }, () => request.current?.abort(),
  ), [refresh]));

  const onRefresh = useCallback(() => { void refresh(true); }, [refresh]);
  return { venues, loading, refreshing, offersLoading, error, refresh, onRefresh };
}

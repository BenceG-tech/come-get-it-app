import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { fetchVenueCoverUrl, fetchVenues } from '@/lib/venueService';
import type { Venue } from '@/types/venue';
import { useAuth } from '@/context/AuthContext';

type FavoritesContextType = {
  favoriteVenueIds: string[];
  favoriteVenues: Venue[];
  isLoading: boolean;
  syncError: string | null;
  isFavorite: (venueId: string) => boolean;
  toggleFavorite: (venueId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
};

function sanitizeFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const ids: string[] = [];

  value.forEach((item: unknown) => {
    const id = typeof item === 'string' ? item.trim() : String(item ?? '').trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });

  return ids;
}

function readFavoriteVenueIds(metadata: unknown): string[] {
  const record = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {};
  return sanitizeFavoriteIds(record.favorite_venue_ids ?? record.favoriteVenueIds ?? record.favourite_venue_ids);
}

async function hydrateVenueImages(venues: Venue[]): Promise<Venue[]> {
  return Promise.all(
    venues.map(async (venue: Venue): Promise<Venue> => {
      if (venue.image_url || venue.hero_image_url) return venue;
      const coverUrl = await fetchVenueCoverUrl(venue.id);
      return coverUrl ? { ...venue, image_url: coverUrl } : venue;
    })
  );
}

/** Provides account-synced venue favourites stored in Supabase user metadata. */
export const [FavoritesProvider, useFavorites] = createContextHook<FavoritesContextType>(() => {
  const supabase = useMemo(() => getSupabase(), []);
  const { session, isAuthReady } = useAuth();
  const [favoriteVenueIds, setFavoriteVenueIds] = useState<string[]>([]);
  const [favoriteVenues, setFavoriteVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const refreshFavorites = useCallback(async (): Promise<void> => {
    if (!isAuthReady) return;

    const userId = session?.user?.id;
    if (!userId) {
      setFavoriteVenueIds([]);
      setFavoriteVenues([]);
      setSyncError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      const ids = readFavoriteVenueIds(data?.user?.user_metadata ?? session?.user?.user_metadata);
      setFavoriteVenueIds(ids);
      setSyncError(null);
    } catch (error) {
      console.warn('[Favorites] Failed to refresh favourite IDs', error instanceof Error ? error.message : String(error));
      const fallbackIds = readFavoriteVenueIds(session?.user?.user_metadata);
      setFavoriteVenueIds(fallbackIds);
      setSyncError('Nem sikerült frissíteni a kedvenceket. A legutóbbi mentett állapotot mutatjuk.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthReady, session?.user?.id, session?.user?.user_metadata, supabase]);

  useEffect(() => {
    refreshFavorites().catch((error: unknown) => {
      console.warn('[Favorites] Initial refresh failed', error instanceof Error ? error.message : String(error));
    });
  }, [refreshFavorites]);

  useEffect(() => {
    let cancelled = false;

    const loadFavoriteVenues = async (): Promise<void> => {
      if (favoriteVenueIds.length === 0) {
        setFavoriteVenues([]);
        return;
      }

      try {
        const allVenues = await fetchVenues({ orderByCreated: true });
        const ordered = favoriteVenueIds
          .map((id: string) => allVenues.find((venue: Venue) => String(venue.id) === id))
          .filter((venue: Venue | undefined): venue is Venue => Boolean(venue));
        const withImages = await hydrateVenueImages(ordered);

        if (!cancelled) {
          setFavoriteVenues(withImages);
        }
      } catch (error) {
        console.warn('[Favorites] Failed to load favourite venues', error instanceof Error ? error.message : String(error));
        if (!cancelled) {
          setFavoriteVenues((current: Venue[]) => current.filter((venue: Venue) => favoriteVenueIds.includes(String(venue.id))));
          setSyncError('Nem sikerült betölteni a kedvenc helyeket. Próbáld újra később.');
        }
      }
    };

    loadFavoriteVenues().catch((error: unknown) => {
      console.warn('[Favorites] loadFavoriteVenues crashed', error instanceof Error ? error.message : String(error));
    });

    return () => {
      cancelled = true;
    };
  }, [favoriteVenueIds]);

  const isFavorite = useCallback(
    (venueId: string): boolean => favoriteVenueIds.includes(String(venueId)),
    [favoriteVenueIds]
  );

  const toggleFavorite = useCallback(
    async (venueId: string): Promise<boolean> => {
      const normalizedId = String(venueId).trim();
      if (!normalizedId) return false;

      const userId = session?.user?.id;
      if (!userId) {
        setSyncError('A kedvencek mentéséhez jelentkezz be.');
        return false;
      }

      const previousIds = favoriteVenueIds;
      const nextIds = previousIds.includes(normalizedId)
        ? previousIds.filter((id: string) => id !== normalizedId)
        : [normalizedId, ...previousIds];

      setFavoriteVenueIds(nextIds);
      setSyncError(null);

      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const currentMetadata =
          data?.user?.user_metadata && typeof data.user.user_metadata === 'object'
            ? (data.user.user_metadata as Record<string, unknown>)
            : {};

        const { error } = await supabase.auth.updateUser({
          data: {
            ...currentMetadata,
            favorite_venue_ids: nextIds,
          },
        });

        if (error) throw error;
        return true;
      } catch (error) {
        console.warn('[Favorites] Failed to sync favourite change', error instanceof Error ? error.message : String(error));
        setFavoriteVenueIds(previousIds);
        setSyncError('Nem sikerült menteni a kedvencet. Ellenőrizd a kapcsolatot és próbáld újra.');
        return false;
      }
    },
    [favoriteVenueIds, session?.user?.id, supabase]
  );

  return {
    favoriteVenueIds,
    favoriteVenues,
    isLoading,
    syncError,
    isFavorite,
    toggleFavorite,
    refreshFavorites,
  };
});

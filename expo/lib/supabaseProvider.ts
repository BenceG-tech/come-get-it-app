import { getSupabase } from '@/lib/supabaseClient';
import { VENUE_PUBLIC_COLUMNS, Venue, VenueWithDetails } from '@/types/venue';
import { Reward } from '@/types/reward';
import { runSupabaseRead } from '@/lib/supabaseRequest';

import { fetchFreeDrinkData, normalizeVenue, readVenueData, rememberVenues, UNKNOWN_DRINK_DATA } from '@/lib/venueData';

const VENUE_IMAGE_COLUMNS = 'id,venue_id,url,label,is_cover';
const REWARD_PUBLIC_COLUMNS = 'id,venue_id,name,description,points_required,valid_until,active,image_url,category,is_global,partner_id,priority,terms_conditions,max_redemptions,current_redemptions';

function toYyyyMmDd(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function isUuidLike(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function fetchRewardsQuery(params: { venueId?: string; scope: 'app' | 'venue' }): Promise<Reward[]> {
  const today = toYyyyMmDd(new Date());
  const venueId = params.venueId;
  const hasValidVenueId = isUuidLike(venueId);
  const globalOnly = params.scope === 'venue' && venueId && !hasValidVenueId;
  const supabase = getSupabase();
  let query = supabase
    .from('consumer_rewards')
    .select(REWARD_PUBLIC_COLUMNS)
    .eq('active', true)
    .gte('valid_until', today)
    .order('priority', { ascending: false, nullsFirst: false })
    .order('points_required', { ascending: true });

  if (params.scope === 'venue' && hasValidVenueId) {
    query = query.or(`venue_id.eq.${venueId},partner_id.eq.${venueId},is_global.eq.true`);
  } else if (globalOnly) {
    query = query.eq('is_global', true);
  }

  const data = await runSupabaseRead<unknown[]>(
    params.scope === 'app' ? 'Jutalmak betöltése' : 'Helyszín jutalmainak betöltése',
    () => query,
  );
  const rewards = Array.isArray(data) ? (data as unknown as Reward[]) : [];
  console.info('[Provider] fetchRewardsQuery result', { count: rewards.length });
  return rewards;
}

export async function fetchRewards(venueId: string): Promise<Reward[]> {
  const normalizedVenueId = String(venueId ?? '').trim();
  console.info('[Provider] fetchRewards', { venueId: normalizedVenueId });

  if (!isUuidLike(normalizedVenueId)) {
    console.warn('[Provider] fetchRewards received non-UUID venueId; using global rewards fallback', { venueId: normalizedVenueId });
    return fetchRewardsQuery({ venueId: normalizedVenueId, scope: 'venue' });
  }
  return fetchRewardsQuery({ venueId: normalizedVenueId, scope: 'venue' });
}

export async function fetchAppRewards(): Promise<Reward[]> {
  return fetchRewardsQuery({ scope: 'app' });
}

export async function fetchRewardById(rewardId: string): Promise<Reward | null> {
  const normalizedRewardId = String(rewardId ?? '').trim();
  if (!isUuidLike(normalizedRewardId)) return null;

  const today = toYyyyMmDd(new Date());
  const data = await runSupabaseRead<Record<string, unknown>>(
    'Jutalom részleteinek betöltése',
    () => getSupabase()
      .from('consumer_rewards')
      .select(REWARD_PUBLIC_COLUMNS)
      .eq('id', normalizedRewardId)
      .eq('active', true)
      .gte('valid_until', today)
      .maybeSingle(),
  );
  return data ? (data as unknown as Reward) : null;
}

type VenueDetailsOptions = {
  signal?: AbortSignal;
  onBase?: (venue: VenueWithDetails) => void;
};

export async function getVenueWithDetails(id: string, options: VenueDetailsOptions = {}): Promise<VenueWithDetails | null> {
  const normalizedId = decodeURIComponent(String(id)).trim();
  if (!normalizedId) return null;
  const supabase = getSupabase();
  const basePromise = readVenueData<unknown[]>('Vendéglátóhely betöltése', (signal) => supabase
    .from('venues').select(VENUE_PUBLIC_COLUMNS).eq('id', normalizedId).limit(1).abortSignal(signal), options.signal)
    .then((rows) => {
      if (!Array.isArray(rows) || rows.length === 0) return null;
      const venue = { ...normalizeVenue(rows[0] as Venue), freeDrinkData: UNKNOWN_DRINK_DATA };
      rememberVenues([venue]);
      if (!options.signal?.aborted) options.onBase?.(venue);
      return venue;
    });
  const imagesPromise = readVenueData<unknown[]>('Helyszínképek betöltése', (signal) => supabase
    .from('venue_images').select(VENUE_IMAGE_COLUMNS).eq('venue_id', normalizedId).order('is_cover', { ascending: false }).abortSignal(signal), options.signal)
    .catch(() => []);
  const offersPromise = fetchFreeDrinkData([normalizedId], options.signal);
  const [venue, imageRows, offers] = await Promise.all([basePromise, imagesPromise, offersPromise]);
  if (!venue || options.signal?.aborted) return null;
  const images = [...new Set((imageRows ?? []).map((row) => (row as { url?: string }).url?.trim())
    .filter((url): url is string => !!url && url.length <= 2000))];
  const freeDrinkData = offers.get(normalizedId) ?? UNKNOWN_DRINK_DATA;
  const details: VenueWithDetails = { ...venue, images, drinks: freeDrinkData.drinks, freeDrinkWindows: freeDrinkData.windows, freeDrinkData };
  rememberVenues([details]);
  return details;
}

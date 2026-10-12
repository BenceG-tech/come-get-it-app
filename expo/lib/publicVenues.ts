import type { Venue } from '@/types/venue';

type PageOptions = { limit?: number; offset?: number; orderByCreated?: boolean; signal?: AbortSignal };

/** Public catalogue, independent of auth/session locks. Never fall back to a stored list on success. */
export async function fetchPublicVenueRows(options: PageOptions = {}): Promise<Venue[]> {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!baseUrl) throw new Error('Hiányzó kiszolgálóbeállítás.');
  const rows = new Map<string, Venue>();
  let offset = options.offset ?? 0;
  let remaining = options.limit ?? Infinity;
  while (remaining > 0) {
    if (options.signal?.aborted) throw new Error('Megszakított kérés');
    const pageSize = Math.min(100, remaining);
    const url = new URL(`${baseUrl}/functions/v1/get-public-venues`);
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('sort', options.orderByCreated === false ? 'default' : 'newest');
    url.searchParams.set('v', String(Date.now()));
    const response = await fetch(url.toString(), { signal: options.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`A helyszínek nem tölthetők be (${response.status}).`);
    const page: unknown = await response.json();
    if (!Array.isArray(page) || page.some((row) => !row || typeof row.id !== 'string' || typeof row.name !== 'string')) {
      throw new Error('Hibás helyszínlista érkezett.');
    }
    for (const row of page as Venue[]) if (row.is_paused !== true) rows.set(row.id, row);
    if (page.length < pageSize) break;
    offset += page.length;
    remaining -= page.length;
  }
  if (options.signal?.aborted) throw new Error('Megszakított kérés');
  return [...rows.values()];
}

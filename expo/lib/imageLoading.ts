export type ImageSize = 480 | 960 | 1280;

/** Only resize public Storage images; signed/private and external URLs remain untouched. */
export function imageCandidates(uris: (string | null | undefined)[], size: ImageSize = 960): string[] {
  const candidates: string[] = [];
  for (const value of uris) {
    if (!value?.trim()) continue;
    try {
      const url = new URL(value.trim());
      if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
      const original = url.toString();
      if (url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
        && url.pathname.startsWith('/storage/v1/object/public/') && !url.search && !url.hash
        && /\.(png|jpe?g|webp|avif|heic)$/i.test(url.pathname)) {
        url.pathname = url.pathname.replace('/object/public/', '/render/image/public/');
        url.searchParams.set('width', String(size));
        url.searchParams.set('quality', '75');
        candidates.push(url.toString());
      }
      candidates.push(original);
    } catch { /* A malformed saved URL must not break the venue screen. */ }
  }
  return [...new Set(candidates)];
}

export type ImageLoadState = { run: number; attempt: number; status: 'loading' | 'waiting' | 'loaded' | 'failed' };
export type ImageLoadAction = { type: 'loaded' | 'error' | 'next'; request: string; count: number } | { type: 'reset' };
export const initialImageLoadState: ImageLoadState = { run: 0, attempt: 0, status: 'loading' };
export const imageRequestKey = (state: ImageLoadState) => `${state.run}:${state.attempt}`;

/** Bounded retry: each optimized/original candidate gets at most two attempts per run. */
export function imageLoadReducer(state: ImageLoadState, action: ImageLoadAction): ImageLoadState {
  if (action.type === 'reset') return { run: state.run + 1, attempt: 0, status: 'loading' };
  if (action.request !== imageRequestKey(state)) return state;
  if (action.type === 'next') return state.status === 'waiting' ? { ...state, attempt: state.attempt + 1, status: 'loading' } : state;
  if (state.status !== 'loading') return state;
  if (action.type === 'loaded') return { ...state, status: 'loaded' };
  return { ...state, status: state.attempt + 1 < action.count * 2 ? 'waiting' : 'failed' };
}

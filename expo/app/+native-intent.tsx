// Deep links that open a specific screen; every other link lands on the start screen.
//   comegetit://venue-code?code=FIRST24  - venue table-tent QR (pre-fills the venue code)
//   comegetit://spend-points             - return address after linking a bank via Salt Edge
// Parsed by hand: React Native's URL implementation does not support searchParams.
const ALLOWED_PATHS = ['venue-code', 'spend-points'];

export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  const [location, query = ''] = path.replace(/^comegetit:\/\//, '').split('?');
  const target = location.replace(/^\/+/, '').split('/')[0];
  if (!ALLOWED_PATHS.includes(target)) return '/';

  const code = query
    .split('&')
    .map((pair) => pair.split('='))
    .find(([key]) => key === 'code')?.[1];
  const cleanCode = code ? decodeURIComponent(code).replace(/[^A-Za-z0-9]/g, '').slice(0, 12) : '';
  return target === 'venue-code' && cleanCode ? `/venue-code?code=${cleanCode}` : `/${target}`;
}

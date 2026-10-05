import { EdgeRequestError, postAuthenticatedFunction } from '@/lib/edgeRequest';

export type AccountDeletionResult =
  | { status: 'deleted'; manualAppleRevocation: boolean }
  | { status: 'pending'; requestId: string };

export async function requestAccountDeletion(userId: string, appleAuthorizationCode?: string): Promise<AccountDeletionResult> {
  const result = await postAuthenticatedFunction('delete-account', {
    ...(appleAuthorizationCode ? { apple_authorization_code: appleAuthorizationCode } : {}),
  }, 25_000, userId);
  if (result.success === true) {
    return { status: 'deleted', manualAppleRevocation: result.apple_revocation === 'manual_required' };
  }
  if (result.status === 'pending' && result.code === 'ACCOUNT_DELETION_REQUESTED' && typeof result.request_id === 'string') {
    return { status: 'pending', requestId: result.request_id };
  }
  throw new EdgeRequestError('A törlés befejezését a kiszolgáló nem igazolta.', 'INVALID_RESPONSE');
}

export function accountDeletionErrorMessage(error: unknown): string {
  const code = error instanceof EdgeRequestError ? error.code : '';
  if (code === 'APPLE_IDENTITY_MISMATCH') return 'Másik Apple-fiókot választottál. A törléshez az ehhez a Come Get It-fiókhoz tartozó Apple-fiókot használd.';
  if (code === 'UNAUTHORIZED' || code === 'SESSION_CHANGED') return 'A munkamenet megváltozott vagy lejárt. Jelentkezz be újra, majd indítsd el a fióktörlést.';
  if (code === 'TIMEOUT' || code === 'NETWORK_ERROR') return 'A kapcsolat megszakadt, ezért a törlés eredményét még nem tudtuk ellenőrizni. Ellenőrizd az internetkapcsolatot. Ha a fiók még elérhető, próbáld újra a törlést.';
  return 'A törlés befejezését nem sikerült ellenőrizni. A fiókadatok betöltésétől függetlenül itt újra próbálhatod.';
}

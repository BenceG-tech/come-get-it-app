import { getSupabase } from '@/lib/supabaseClient';

const DEFAULT_DATA_TIMEOUT_MS = 15_000;

type QueryError = {
  code?: string;
  message?: string;
  status?: number;
};

type QueryResult<T> = {
  data: T | null;
  error: QueryError | null;
};

export function withDataTimeout<T>(
  promise: PromiseLike<T>,
  label: string,
  timeoutMs = DEFAULT_DATA_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label}: a kiszolgáló nem válaszolt időben`));
    }, timeoutMs);

    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function isAuthenticationError(error: QueryError | null): boolean {
  if (!error) return false;
  const code = String(error.code ?? '').toLowerCase();
  const message = String(error.message ?? '').toLowerCase();
  return (
    error.status === 401 ||
    code === 'pgrst301' ||
    message.includes('jwt') ||
    message.includes('token') ||
    message.includes('not authenticated')
  );
}

/**
 * Runs a Supabase read with a bounded wait. If the stored session became stale,
 * it refreshes it once and repeats the read before surfacing an error.
 */
export async function runSupabaseRead<T>(
  label: string,
  createQuery: () => PromiseLike<QueryResult<T>>,
): Promise<T | null> {
  let result = await withDataTimeout(createQuery(), label);

  if (isAuthenticationError(result.error)) {
    const supabase = getSupabase();
    const refreshResult = await withDataTimeout(
      supabase.auth.refreshSession(),
      `${label} munkamenet-frissítés`,
      10_000,
    );

    if (!refreshResult.error && refreshResult.data.session) {
      result = await withDataTimeout(createQuery(), `${label} újrapróbálás`);
    }
  }

  if (result.error) throw result.error;
  return result.data;
}

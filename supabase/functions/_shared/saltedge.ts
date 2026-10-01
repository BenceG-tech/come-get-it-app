// Shared Salt Edge (Partners API v1) helpers for the saltedge-* Edge Functions.
//
// SALTEDGE_MODE switches the whole feature:
//   off     - feature hidden in the app, callbacks ignored (default)
//   mock    - no Salt Edge calls; connections and transactions are simulated (admin test button)
//   sandbox - real Salt Edge API with test credentials and fake banks
//   live    - production
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type SaltEdgeMode = 'off' | 'mock' | 'sandbox' | 'live';

export const SALTEDGE_API_BASE = 'https://www.saltedge.com/api/partners/v1';
// Consent length requested from the bank; PSD2 allows re-use without re-authentication for up to 180 days.
export const CONSENT_PERIOD_DAYS = Number(Deno.env.get('SALTEDGE_CONSENT_DAYS') ?? '180');
// Matches at or above this confidence earn points; weaker ones wait for admin review.
export const MIN_POINTS_CONFIDENCE = 0.9;

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function getMode(): SaltEdgeMode {
  const mode = (Deno.env.get('SALTEDGE_MODE') ?? 'off').toLowerCase();
  return mode === 'mock' || mode === 'sandbox' || mode === 'live' ? mode : 'off';
}

// Customers created in sandbox use the same column as live ones; mode keeps them apart in reports.
export function customerMode(mode: SaltEdgeMode): 'mock' | 'sandbox' | 'live' {
  return mode === 'off' ? 'live' : mode;
}

// ---------------------------------------------------------------------------
// Salt Edge API
// ---------------------------------------------------------------------------

export type SaltEdgeTransaction = {
  id: string;
  account_id?: string;
  duplicated?: boolean;
  mode?: string;
  status?: string; // 'posted' | 'pending'
  made_on: string;
  amount: number;
  currency_code: string;
  description?: string;
  category?: string;
  merchant_id?: string;
  extra?: {
    payee?: string;
    merchant_id?: string;
    mcc?: string;
    posting_date?: string;
    time?: string;
    [key: string]: unknown;
  };
};

type ApiList<T> = { data: T[]; meta?: { next_id?: string | null } };

export class SaltEdgeClient {
  constructor(private appId: string, private secret: string) {}

  static fromEnv(): SaltEdgeClient {
    const appId = Deno.env.get('SALTEDGE_APP_ID');
    const secret = Deno.env.get('SALTEDGE_SECRET');
    if (!appId || !secret) throw new Error('SALTEDGE_APP_ID and SALTEDGE_SECRET must be set');
    return new SaltEdgeClient(appId, secret);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${SALTEDGE_API_BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'App-id': this.appId,
        Secret: this.secret,
      },
      body: body === undefined ? undefined : JSON.stringify({ data: body }),
    });
    if (res.status === 204) return undefined as T;
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = (payload as { error?: { class?: string; message?: string } }).error;
      throw new Error(`Salt Edge ${method} ${path} failed (${res.status}): ${error?.class ?? ''} ${error?.message ?? ''}`.trim());
    }
    return payload as T;
  }

  createLead(email: string, identifier: string) {
    return this.request<{ data: { customer_id: string } }>('POST', '/leads', { email, identifier });
  }

  createLeadSession(customerId: string, fromDate: string, returnTo: string) {
    return this.request<{ data: { redirect_url: string; expires_at: string } }>('POST', '/lead_sessions/create', {
      customer_id: customerId,
      consent: {
        from_date: fromDate,
        period_days: CONSENT_PERIOD_DAYS,
        scopes: ['account_details', 'transactions_details'],
      },
      attempt: {
        from_date: fromDate,
        fetch_scopes: ['accounts', 'transactions'],
        return_to: returnTo,
      },
    });
  }

  listConnections(customerId: string) {
    return this.request<ApiList<{ id: string; provider_code?: string; provider_name?: string; status?: string }>>(
      'GET',
      `/connections?customer_id=${encodeURIComponent(customerId)}`,
    );
  }

  listAccounts(connectionId: string) {
    return this.request<ApiList<{ id: string; nature?: string }>>(
      'GET',
      `/accounts?connection_id=${encodeURIComponent(connectionId)}`,
    );
  }

  async listAllTransactions(connectionId: string, accountId: string): Promise<SaltEdgeTransaction[]> {
    const all: SaltEdgeTransaction[] = [];
    let fromId: string | null | undefined = undefined;
    for (let page = 0; page < 50; page++) {
      const query = new URLSearchParams({ connection_id: connectionId, account_id: accountId });
      if (fromId) query.set('from_id', fromId);
      const res: ApiList<SaltEdgeTransaction> = await this.request('GET', `/transactions?${query.toString()}`);
      all.push(...(res.data ?? []));
      fromId = res.meta?.next_id;
      if (!fromId) break;
    }
    return all;
  }

  deleteConnection(connectionId: string) {
    return this.request<void>('DELETE', `/connections/${encodeURIComponent(connectionId)}`);
  }
}

// ---------------------------------------------------------------------------
// Callback signature: base64 RSA-SHA256 over "callback_url|raw_body"
// ---------------------------------------------------------------------------

// Partners API callback key, published at https://docs.saltedge.com/partners/v1/ (signature section).
export const PARTNERS_CALLBACK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvL/Xxdmj7/cpZgvDMvxr
nTTU/vkHGM/qkJ0Q+rmfYLru0Z/rSWthPDEK3orY5BTa0sAe2wUV5Fes677X6+Ib
roCF8nODW5hSVTrqWcrQ55I7InpFkpTxyMkiFN8XPS7qmYXl/xofbYq0olcwE/aw
9lfHlZD7iwOpVJqTsYiXzSMRu92ZdECV895kYS/ggymSEtoMSW3405dQ6OfnK53x
7AJPdkAp0Wa2Lk4BNBMd24uu2tasO1bTYBsHpxonwbA+o8BXffdTEloloJgW7pV+
TWvxB/Uxil4yhZZJaFmvTCefxWFovyzLdjn2aSAEI7D1y4IYOdByMOPYQ6Mn7J9A
9wIDAQAB
-----END PUBLIC KEY-----`;

function decodeBase64(value: string): ArrayBuffer {
  const binary = atob(value.replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return bytes.buffer as ArrayBuffer;
}

export async function verifyCallbackSignature(callbackUrl: string, rawBody: string, signature: string): Promise<boolean> {
  try {
    const pem = Deno.env.get('SALTEDGE_CALLBACK_PUBLIC_KEY') ?? PARTNERS_CALLBACK_PUBLIC_KEY;
    const keyBytes = decodeBase64(pem.replace('-----BEGIN PUBLIC KEY-----', '').replace('-----END PUBLIC KEY-----', ''));
    const key = await crypto.subtle.importKey('spki', keyBytes, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodeBase64(signature), new TextEncoder().encode(`${callbackUrl}|${rawBody}`));
  } catch (error) {
    console.error('[saltedge] signature verification failed', error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Venue matching
// ---------------------------------------------------------------------------

type MerchantMatchRules = { names?: string[]; contains?: string[] };

export type MatchableVenue = { id: string; name: string; merchant_match_rules: MerchantMatchRules | null };

export type VenueMatch = { venueId: string; venueName: string; confidence: number; method: string };

function normalize(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// MCC alone never matches: any bar shares the code, and storing a non-partner payment would
// keep bank data we have no reason to hold. Such payments only show up as a counter.
export function matchVenue(tx: SaltEdgeTransaction, venues: MatchableVenue[]): VenueMatch | null {
  const merchant = normalize(tx.extra?.payee ?? tx.merchant_id ?? tx.extra?.merchant_id);
  const description = normalize(tx.description);
  const haystack = `${merchant} ${description}`;

  for (const venue of venues) {
    const rules = venue.merchant_match_rules ?? {};
    if (rules.names?.some((name) => normalize(name) && haystack.includes(normalize(name)))) {
      return { venueId: venue.id, venueName: venue.name, confidence: 1, method: 'merchant_name' };
    }
  }
  for (const venue of venues) {
    const rules = venue.merchant_match_rules ?? {};
    if (rules.contains?.some((part) => normalize(part) && description.includes(normalize(part)))) {
      return { venueId: venue.id, venueName: venue.name, confidence: 0.9, method: 'description_contains' };
    }
  }
  return null;
}

const HOSPITALITY_MCC = new Set(['5812', '5813', '5814']);

// ---------------------------------------------------------------------------
// Storing and awarding
// ---------------------------------------------------------------------------

// unmatched_hospitality: restaurant/bar payments that matched no partner, a hint that a venue's bank name changed.
export type ProcessStats = { seen: number; matched: number; unmatched_hospitality: number; stored: number; points: number; errors: number };

export async function loadMatchableVenues(admin: SupabaseClient): Promise<MatchableVenue[]> {
  const { data, error } = await admin
    .from('venues')
    .select('id, name, merchant_match_rules')
    .eq('is_paused', false)
    .not('merchant_match_rules', 'is', null);
  if (error) throw error;
  return (data ?? []) as MatchableVenue[];
}

// Only transactions that match a partner venue are stored; everything else is counted and dropped.
export async function processTransactions(
  admin: SupabaseClient,
  connection: { id: string; user_id: string },
  transactions: SaltEdgeTransaction[],
  venues: MatchableVenue[],
): Promise<ProcessStats> {
  const stats: ProcessStats = { seen: 0, matched: 0, unmatched_hospitality: 0, stored: 0, points: 0, errors: 0 };

  for (const tx of transactions) {
    stats.seen++;
    if (tx.duplicated || !tx.amount || tx.currency_code !== 'HUF') continue;

    const match = matchVenue(tx, venues);
    if (!match) {
      if (tx.amount < 0 && HOSPITALITY_MCC.has(String(tx.extra?.mcc ?? ''))) stats.unmatched_hospitality++;
      continue;
    }
    stats.matched++;

    const isRefund = tx.amount > 0;
    const isPending = tx.status === 'pending';

    const { data: existing } = await admin
      .from('saltedge_transactions')
      .select('id, points_status')
      .eq('se_transaction_id', tx.id)
      .maybeSingle();

    const row = {
      se_transaction_id: tx.id,
      se_account_id: tx.account_id ?? null,
      user_id: connection.user_id,
      connection_id: connection.id,
      amount_cents: Math.round(Math.abs(tx.amount) * 100),
      amount: Math.round(Math.abs(tx.amount)),
      currency: tx.currency_code,
      made_on: tx.made_on,
      merchant_name: tx.extra?.payee ?? null,
      merchant_code: tx.merchant_id ?? tx.extra?.merchant_id ?? null,
      mcc: tx.extra?.mcc ?? null,
      description: tx.description ?? null,
      matched_venue_id: match.venueId,
      match_status: 'matched',
      match_method: match.method,
      match_confidence: match.confidence,
      is_pending: isPending,
      is_refund: isRefund,
      raw: tx,
      updated_at: new Date().toISOString(),
    };

    let id = existing?.id as string | undefined;
    if (existing) {
      // Re-fetches only move a pending row forward; settled points are never recalculated.
      if (existing.points_status !== 'pending' && existing.points_status !== 'none') continue;
      const { error } = await admin.from('saltedge_transactions').update(row).eq('id', existing.id);
      if (error) {
        stats.errors++;
        console.error('[saltedge] update failed', tx.id, error.message);
        continue;
      }
    } else {
      const { data: inserted, error } = await admin.from('saltedge_transactions').insert(row).select('id').single();
      if (error || !inserted) {
        stats.errors++;
        console.error('[saltedge] insert failed', tx.id, error?.message);
        continue;
      }
      id = inserted.id;
    }
    stats.stored++;

    const { data: award, error: awardError } = await admin.rpc('award_spend_points', { p_transaction_id: id });
    if (awardError) {
      stats.errors++;
      console.error('[saltedge] award failed', tx.id, awardError.message);
      continue;
    }
    stats.points += Number((award as { points?: number })?.points ?? 0);
  }

  return stats;
}

// Pulls every account's transactions for one connection and processes them.
export async function syncConnection(
  admin: SupabaseClient,
  client: SaltEdgeClient,
  connection: { id: string; se_connection_id: string; user_id: string },
): Promise<ProcessStats> {
  const venues = await loadMatchableVenues(admin);
  const total: ProcessStats = { seen: 0, matched: 0, unmatched_hospitality: 0, stored: 0, points: 0, errors: 0 };
  const accounts = await client.listAccounts(connection.se_connection_id);
  for (const account of accounts.data ?? []) {
    const txs = await client.listAllTransactions(connection.se_connection_id, account.id);
    const stats = await processTransactions(admin, connection, txs, venues);
    for (const key of Object.keys(total) as (keyof ProcessStats)[]) total[key] += stats[key];
  }
  await admin
    .from('saltedge_connections')
    .update({ last_synced_at: new Date().toISOString(), last_fetch_stats: total, last_error: null, updated_at: new Date().toISOString() })
    .eq('id', connection.id);
  return total;
}

export type ActivityEvent = 'app_open' | 'venue_viewed' | 'reward_viewed' | 'profile_viewed'
  | 'qr_generated' | 'redemption_attempt' | 'redemption_success';
export type ActivityMetadata = {
  flow?: 'free_drink' | 'points_reward';
  outcome?: 'started' | 'failed' | 'expired' | 'revoked' | 'closed' | 'restored';
  duration_ms?: number;
};
export type ActivityRecord = {
  event_type: ActivityEvent;
  venue_id?: string;
  metadata: ActivityMetadata & { source: 'mobile' };
};

/** Best-effort first-party events. Nothing is persisted or retried after logout. */
export function createActivityTracker(send: (owner: string, event: ActivityRecord) => Promise<unknown>, now = Date.now) {
  let owner: string | null = null;
  const recent = new Map<string, number>();
  return {
    setUser(userId: string | null) {
      if (owner !== userId) recent.clear();
      owner = userId;
    },
    record(event: ActivityEvent, venueId?: string, metadata: ActivityMetadata = {}, dedupeKey?: string): void {
      if (!owner) return;
      const key = `${event}:${dedupeKey ?? venueId ?? ''}:${metadata.outcome ?? ''}`;
      const at = now();
      const interval = event === 'app_open' ? 30_000 : 2_000;
      const previous = recent.get(key);
      if (previous !== undefined && at - previous < interval) return;
      recent.set(key, at);
      if (recent.size > 100) recent.delete(recent.keys().next().value!);
      const record: ActivityRecord = { event_type: event, metadata: { ...metadata, source: 'mobile' } };
      if (venueId) record.venue_id = venueId;
      // Scheduling and delivery must never block the screen, auth or redemption.
      try { void send(owner, record).catch(() => undefined); } catch { /* best effort */ }
    },
  };
}

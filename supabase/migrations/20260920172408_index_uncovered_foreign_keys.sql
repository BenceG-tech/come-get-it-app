-- Cover every remaining public-schema foreign key so deletes/updates on parent
-- rows and the app's venue/redemption joins do not degrade into table scans.

create index if not exists idx_ai_notification_suggestions_created_by
  on public.ai_notification_suggestions (created_by);
create index if not exists idx_ai_notification_suggestions_sent_notification_id
  on public.ai_notification_suggestions (sent_notification_id);
create index if not exists idx_anomaly_logs_resolved_by
  on public.anomaly_logs (resolved_by);
create index if not exists idx_autopilot_rules_created_by
  on public.autopilot_rules (created_by);
create index if not exists idx_csr_donations_charity_id
  on public.csr_donations (charity_id);
create index if not exists idx_csr_donations_user_id
  on public.csr_donations (user_id);
create index if not exists idx_csr_donations_venue_id
  on public.csr_donations (venue_id);
create index if not exists idx_notification_logs_template_id
  on public.notification_logs (template_id);
create index if not exists idx_notification_templates_created_by
  on public.notification_templates (created_by);
create index if not exists idx_platform_settings_updated_by
  on public.platform_settings (updated_by);
create index if not exists idx_platform_snapshots_hottest_venue_id
  on public.platform_snapshots (hottest_venue_id);
create index if not exists idx_points_transactions_venue_id
  on public.points_transactions (venue_id);
create index if not exists idx_redemption_tokens_consumed_by_staff_id
  on public.redemption_tokens (consumed_by_staff_id);
create index if not exists idx_redemption_tokens_drink_id
  on public.redemption_tokens (drink_id);
create index if not exists idx_redemption_transaction_matches_saltedge_transaction_id
  on public.redemption_transaction_matches (saltedge_transaction_id);
create index if not exists idx_redemptions_drink_id
  on public.redemptions (drink_id);
create index if not exists idx_report_logs_schedule_id
  on public.report_logs (schedule_id);
create index if not exists idx_saltedge_transactions_connection_id
  on public.saltedge_transactions (connection_id);
create index if not exists idx_token_rate_limits_venue_id
  on public.token_rate_limits (venue_id);
create index if not exists idx_user_qr_tokens_user_id
  on public.user_qr_tokens (user_id);
create index if not exists idx_venues_default_charity_id
  on public.venues (default_charity_id);

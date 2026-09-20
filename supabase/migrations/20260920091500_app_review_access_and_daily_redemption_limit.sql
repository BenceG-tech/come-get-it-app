-- App Review accounts are managed only by the service role. No client-facing
-- policy is created, so a signed-in user cannot grant this flag to themselves.
create table if not exists public.app_review_testers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_review_testers enable row level security;
revoke all on table public.app_review_testers from anon, authenticated;

comment on table public.app_review_testers is
  'Service-role-only allowlist for App Store reviewers. Bypasses venue distance and offer time-window checks, but not authentication or token validation.';

-- Normal accounts can complete at most one successful free-drink redemption
-- per Budapest calendar day. App Review transactions are marked separately so
-- reviewers can repeat the test flow during review.
create unique index if not exists redemptions_one_success_per_user_budapest_day
  on public.redemptions (
    user_id,
    ((redeemed_at at time zone 'Europe/Budapest')::date)
  )
  where status = 'success'
    and user_id is not null
    and coalesce(metadata->>'flow', '') <> 'app_review';

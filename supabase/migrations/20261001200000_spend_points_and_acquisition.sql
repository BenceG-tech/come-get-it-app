-- Spend-based points (Salt Edge open banking) + free-drink spend impact + user acquisition attribution.
--
-- Applied to production on 2026-10-01 (with Bence's approval) as four migrations:
-- spend_points_1_venue_referral_code, spend_points_2_saltedge_columns, spend_points_3_user_acquisition,
-- spend_points_4_award_and_reports. Every Salt Edge table touched here was empty at that point.
--
-- Rollback (if ever needed, before real data exists):
--   drop trigger if exists redemptions_classify_user_acquisition on public.redemptions;
--   drop function if exists public.get_venue_free_drink_impact(date, date, uuid, boolean);
--   drop function if exists public.get_venue_acquisition_stats(date, date, uuid);
--   drop function if exists public.award_spend_points(uuid);
--   drop function if exists public.claim_venue_referral_code(text);
--   drop function if exists private.classify_user_acquisition_trigger();
--   drop function if exists private.classify_user_acquisition_for(uuid);
--   drop function if exists private.is_internal_user(uuid);
--   drop table if exists public.user_acquisition;
--   alter table public.venues drop column if exists referral_code;
--   (the added saltedge_* columns are nullable/defaulted and can stay)

-- ---------------------------------------------------------------------------
-- 1. Salt Edge tables
-- ---------------------------------------------------------------------------

alter table public.saltedge_customers
  add column if not exists mode text not null default 'live';

alter table public.saltedge_customers
  drop constraint if exists saltedge_customers_mode_check,
  add constraint saltedge_customers_mode_check check (mode in ('mock', 'sandbox', 'live'));

create unique index if not exists saltedge_customers_user_mode_key
  on public.saltedge_customers (user_id, mode);

alter table public.saltedge_connections
  add column if not exists linked_at timestamptz not null default now(),
  add column if not exists consent_expires_at timestamptz,
  add column if not exists provider_code text,
  add column if not exists last_error text,
  add column if not exists last_fetch_stats jsonb,
  add column if not exists revoked_at timestamptz;

-- amount_cents = absolute amount in fillér; is_refund marks money coming back from the venue.
alter table public.saltedge_transactions
  add column if not exists se_account_id text,
  add column if not exists posted_at timestamptz,
  add column if not exists is_pending boolean not null default false,
  add column if not exists is_refund boolean not null default false,
  add column if not exists match_method text,
  add column if not exists match_confidence numeric(3, 2),
  add column if not exists points_status text not null default 'none',
  add column if not exists processed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.saltedge_transactions
  drop constraint if exists saltedge_transactions_points_status_check,
  add constraint saltedge_transactions_points_status_check check (
    points_status in (
      'none', 'pending', 'review', 'before_link', 'below_minimum', 'not_participating',
      'awarded', 'capped', 'refund_deducted'
    )
  );

create index if not exists saltedge_transactions_user_venue_day_idx
  on public.saltedge_transactions (user_id, matched_venue_id, made_on);
create index if not exists saltedge_transactions_venue_day_idx
  on public.saltedge_transactions (matched_venue_id, made_on);

-- Writes to Salt Edge data happen only through Edge Functions (service role), and venue owners get
-- aggregated numbers through the report RPCs below, never individual guests' bank rows. The old policies
-- are retargeted to service_role (which bypasses RLS anyway) instead of dropped, so they grant nothing.
alter policy "Users can insert their own Salt Edge customer data" on public.saltedge_customers to service_role;
alter policy "Users can update their own connections" on public.saltedge_connections to service_role;
alter policy "Venue owners can view transactions matched to their venues" on public.saltedge_transactions to service_role;

-- Known leftover: redemption_transaction_matches.saltedge_transaction_id still references
-- fidel_transactions. Nothing writes that column yet; re-point it before spend-to-redemption matching uses it.

-- ---------------------------------------------------------------------------
-- 2. Venue referral code (printed on the table tent next to the QR)
-- ---------------------------------------------------------------------------

alter table public.venues
  add column if not exists referral_code text;

alter table public.venues
  drop constraint if exists venues_referral_code_format_check,
  add constraint venues_referral_code_format_check
    check (referral_code is null or referral_code ~ '^[A-Z0-9]{4,12}$');

create unique index if not exists venues_referral_code_key
  on public.venues (referral_code) where referral_code is not null;

-- ---------------------------------------------------------------------------
-- 3. User acquisition: who brought the user, Come Get It or the venue
-- ---------------------------------------------------------------------------

create table if not exists public.user_acquisition (
  user_id uuid primary key references auth.users(id) on delete cascade,
  source text check (source in ('venue_code', 'venue_walk_in', 'cgi')),
  venue_id uuid references public.venues(id) on delete set null,
  referral_code text,
  code_claimed_at timestamptz,
  signup_at timestamptz,
  first_redemption_id uuid references public.redemptions(id) on delete set null,
  first_redemption_at timestamptz,
  first_redemption_venue_id uuid references public.venues(id) on delete set null,
  minutes_to_first_redemption integer,
  classified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_acquisition_venue_idx on public.user_acquisition (venue_id);
create index if not exists user_acquisition_first_venue_idx on public.user_acquisition (first_redemption_venue_id);
create index if not exists user_acquisition_first_redemption_idx on public.user_acquisition (first_redemption_id);

alter table public.user_acquisition enable row level security;

drop policy if exists "Users can view own acquisition" on public.user_acquisition;
create policy "Users can view own acquisition" on public.user_acquisition
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can view all acquisition" on public.user_acquisition;
create policy "Admins can view all acquisition" on public.user_acquisition
  for select to authenticated
  using ((select public.is_admin()));

revoke all on public.user_acquisition from anon, authenticated;
grant select on public.user_acquisition to authenticated;
grant all on public.user_acquisition to service_role;

-- Internal accounts (admins, venue staff/owners, App Review testers) are left out of every report.
create or replace function private.is_internal_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (select 1 from public.profiles p where p.id = p_user_id and p.is_admin)
      or exists (select 1 from public.venue_memberships vm where vm.profile_id = p_user_id)
      or exists (select 1 from public.venues v where v.owner_profile_id = p_user_id)
      or exists (select 1 from public.app_review_testers art where art.user_id = p_user_id and art.enabled);
$$;

revoke all on function private.is_internal_user(uuid) from public, anon, authenticated;

-- Classifies a user once, at their first successful (non App Review) redemption.
--   venue_code    : the user entered the venue's referral code before the first redemption
--   venue_walk_in : no code, but the first redemption came within 180 minutes of signing up
--   cgi           : signed up earlier and came to the venue later (Come Get It brought them)
create or replace function private.classify_user_acquisition_for(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  c_walk_in_minutes constant integer := 180;
  v_existing public.user_acquisition%rowtype;
  v_first record;
  v_signup_at timestamptz;
  v_minutes integer;
  v_source text;
  v_venue_id uuid;
begin
  select * into v_existing from public.user_acquisition where user_id = p_user_id;
  if found and v_existing.classified_at is not null then
    return;
  end if;

  select r.id, r.venue_id, r.redeemed_at
    into v_first
    from public.redemptions r
   where r.user_id = p_user_id
     and r.status = 'success'
     and coalesce(r.metadata ->> 'flow', '') <> 'app_review'
   order by r.redeemed_at asc
   limit 1;

  if not found then
    return;
  end if;

  select coalesce(p.created_at, u.created_at)
    into v_signup_at
    from auth.users u
    left join public.profiles p on p.id = u.id
   where u.id = p_user_id;

  v_minutes := floor(extract(epoch from (v_first.redeemed_at - v_signup_at)) / 60)::integer;

  if v_existing.venue_id is not null and v_existing.code_claimed_at <= v_first.redeemed_at then
    v_source := 'venue_code';
    v_venue_id := v_existing.venue_id;
  elsif v_minutes is not null and v_minutes between 0 and c_walk_in_minutes then
    v_source := 'venue_walk_in';
    v_venue_id := v_first.venue_id;
  else
    v_source := 'cgi';
    v_venue_id := v_first.venue_id;
  end if;

  insert into public.user_acquisition as ua (
    user_id, source, venue_id, signup_at, first_redemption_id, first_redemption_at,
    first_redemption_venue_id, minutes_to_first_redemption, classified_at
  )
  values (
    p_user_id, v_source, v_venue_id, v_signup_at, v_first.id, v_first.redeemed_at,
    v_first.venue_id, v_minutes, now()
  )
  on conflict (user_id) do update
    set source = excluded.source,
        venue_id = excluded.venue_id,
        signup_at = excluded.signup_at,
        first_redemption_id = excluded.first_redemption_id,
        first_redemption_at = excluded.first_redemption_at,
        first_redemption_venue_id = excluded.first_redemption_venue_id,
        minutes_to_first_redemption = excluded.minutes_to_first_redemption,
        classified_at = excluded.classified_at,
        updated_at = now();
end;
$$;

revoke all on function private.classify_user_acquisition_for(uuid) from public, anon, authenticated;

-- Attribution must never block a redemption, so failures only raise a warning.
create or replace function private.classify_user_acquisition_trigger()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.status = 'success' and new.user_id is not null then
    begin
      perform private.classify_user_acquisition_for(new.user_id);
    exception when others then
      raise warning 'classify_user_acquisition failed for %: %', new.user_id, sqlerrm;
    end;
  end if;
  return new;
end;
$$;

revoke all on function private.classify_user_acquisition_trigger() from public, anon, authenticated;

drop trigger if exists redemptions_classify_user_acquisition on public.redemptions;
create trigger redemptions_classify_user_acquisition
  after insert or update of status on public.redemptions
  for each row
  execute function private.classify_user_acquisition_trigger();

-- The signed-in user enters a venue's table code. Allowed within 24 hours of signup and only
-- before the first redemption has classified them.
create or replace function public.claim_venue_referral_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  v_venue record;
  v_signup_at timestamptz;
  v_existing public.user_acquisition%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'code', 'NOT_AUTHENTICATED');
  end if;

  select v.id, v.name
    into v_venue
    from public.venues v
   where v.referral_code = v_code
     and not v.is_paused;

  if not found then
    return jsonb_build_object('success', false, 'code', 'INVALID_CODE');
  end if;

  select * into v_existing from public.user_acquisition where user_id = v_user_id;
  if found and v_existing.classified_at is not null then
    return jsonb_build_object('success', false, 'code', 'ALREADY_CLASSIFIED');
  end if;

  select coalesce(p.created_at, u.created_at)
    into v_signup_at
    from auth.users u
    left join public.profiles p on p.id = u.id
   where u.id = v_user_id;

  if v_signup_at < now() - interval '24 hours' then
    return jsonb_build_object('success', false, 'code', 'TOO_LATE');
  end if;

  insert into public.user_acquisition as ua (user_id, venue_id, referral_code, code_claimed_at, signup_at)
  values (v_user_id, v_venue.id, v_code, now(), v_signup_at)
  on conflict (user_id) do update
    set venue_id = excluded.venue_id,
        referral_code = excluded.referral_code,
        code_claimed_at = excluded.code_claimed_at,
        updated_at = now();

  return jsonb_build_object('success', true, 'venue_id', v_venue.id, 'venue_name', v_venue.name);
end;
$$;

revoke all on function public.claim_venue_referral_code(text) from public, anon;
grant execute on function public.claim_venue_referral_code(text) to authenticated;

-- Backfill users who already redeemed before this migration.
select private.classify_user_acquisition_for(x.user_id)
  from (select distinct user_id from public.redemptions where status = 'success' and user_id is not null) x;

-- ---------------------------------------------------------------------------
-- 4. Points from matched spend (called by the saltedge-* Edge Functions only)
-- ---------------------------------------------------------------------------
-- venues.points_rules keys (all optional): per_huf (default 100 => 10 000 Ft = 100 points),
-- min_amount_huf (default 500), daily_cap_points (default 300 per user per venue per day).
-- Idempotent: a transaction in a final status is never awarded twice.
create or replace function public.award_spend_points(p_transaction_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_tx public.saltedge_transactions%rowtype;
  v_venue record;
  v_linked_at timestamptz;
  v_per_huf integer;
  v_min_huf integer;
  v_cap integer;
  v_huf integer;
  v_full integer;
  v_points integer := 0;
  v_used integer;
  v_earned integer;
  v_status text;
begin
  select * into v_tx from public.saltedge_transactions where id = p_transaction_id for update;
  if not found then
    return jsonb_build_object('success', false, 'code', 'NOT_FOUND');
  end if;

  if v_tx.points_status in ('awarded', 'capped', 'refund_deducted', 'below_minimum', 'not_participating', 'before_link') then
    return jsonb_build_object('success', true, 'status', v_tx.points_status, 'points', v_tx.points_awarded, 'already_processed', true);
  end if;

  select c.linked_at into v_linked_at from public.saltedge_connections c where c.id = v_tx.connection_id;

  select v.id, v.name, v.points_rules, v.participates_in_points
    into v_venue
    from public.venues v
   where v.id = v_tx.matched_venue_id;

  v_huf := v_tx.amount_cents / 100;

  if v_venue.id is null then
    v_status := 'none';
  elsif coalesce(v_tx.match_confidence, 0) < 0.9 then
    v_status := 'review';
  elsif v_tx.is_pending then
    v_status := 'pending';
  elsif v_linked_at is not null and v_tx.made_on < (v_linked_at at time zone 'Europe/Budapest')::date then
    v_status := 'before_link';
  elsif not coalesce(v_venue.participates_in_points, false) then
    v_status := 'not_participating';
  else
    v_per_huf := greatest(coalesce((v_venue.points_rules ->> 'per_huf')::integer, 100), 1);
    v_min_huf := coalesce((v_venue.points_rules ->> 'min_amount_huf')::integer, 500);
    v_cap := coalesce((v_venue.points_rules ->> 'daily_cap_points')::integer, 300);
    v_full := floor(v_huf::numeric / v_per_huf)::integer;

    if v_tx.is_refund then
      -- Take back at most what this venue's spend earned in the 30 days before the refund.
      select coalesce(sum(t.points_awarded), 0)
        into v_earned
        from public.saltedge_transactions t
       where t.user_id = v_tx.user_id
         and t.matched_venue_id = v_tx.matched_venue_id
         and t.made_on between v_tx.made_on - 30 and v_tx.made_on
         and t.id <> v_tx.id;
      v_points := -least(v_full, greatest(v_earned, 0));
      v_status := 'refund_deducted';
      if v_points < 0 then
        perform public.modify_user_points(
          v_tx.user_id, v_points, 'adjust', 'saltedge_transaction', v_tx.id, v_venue.id,
          'Visszatérítés: ' || v_venue.name, 0
        );
      end if;
    elsif v_huf < v_min_huf then
      v_status := 'below_minimum';
    else
      select coalesce(sum(t.points_awarded), 0)
        into v_used
        from public.saltedge_transactions t
       where t.user_id = v_tx.user_id
         and t.matched_venue_id = v_tx.matched_venue_id
         and t.made_on = v_tx.made_on
         and t.points_awarded > 0
         and t.id <> v_tx.id;
      v_points := least(v_full, greatest(v_cap - v_used, 0));
      v_status := case when v_points < v_full then 'capped' else 'awarded' end;
      if v_points > 0 then
        perform public.modify_user_points(
          v_tx.user_id, v_points, 'earn', 'saltedge_transaction', v_tx.id, v_venue.id,
          'Költés: ' || v_venue.name, v_huf
        );
      end if;
    end if;
  end if;

  update public.saltedge_transactions
     set points_awarded = v_points,
         points_status = v_status,
         processed_at = now(),
         updated_at = now()
   where id = v_tx.id;

  return jsonb_build_object('success', true, 'status', v_status, 'points', v_points);
end;
$$;

revoke all on function public.award_spend_points(uuid) from public, anon, authenticated;
grant execute on function public.award_spend_points(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 5. Reports for the Venue Hub (admins: every venue, owners/staff: their own)
-- ---------------------------------------------------------------------------

-- Spend on the same Budapest day as a free-drink redemption, at the same venue.
-- Only guests with a linked bank at redemption time are measurable; the report says how many.
create or replace function public.get_venue_free_drink_impact(
  p_from date,
  p_to date,
  p_venue_id uuid default null,
  p_include_test boolean default false
)
returns table (
  venue_id uuid,
  venue_name text,
  redemptions bigint,
  measurable_redemptions bigint,
  converted_redemptions bigint,
  new_guest_converted bigint,
  total_spend_huf bigint,
  avg_spend_huf numeric,
  returned_30d bigint
)
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_is_admin boolean := private.is_admin(v_uid);
  v_allowed uuid[] := private.get_user_venue_ids(v_uid);
begin
  if v_uid is null then
    return;
  end if;

  return query
  with scoped_venues as (
    select v.id, v.name
      from public.venues v
     where (v_is_admin or v.id = any (v_allowed))
       and (p_venue_id is null or v.id = p_venue_id)
  ),
  free_drinks as (
    select r.id, r.user_id, r.venue_id, r.redeemed_at,
           (r.redeemed_at at time zone 'Europe/Budapest')::date as day
      from public.redemptions r
      join scoped_venues sv on sv.id = r.venue_id
     where r.status = 'success'
       and r.user_id is not null
       and coalesce(r.metadata ->> 'flow', '') <> 'app_review'
       and (r.redeemed_at at time zone 'Europe/Budapest')::date between p_from and p_to
       and not private.is_internal_user(r.user_id)
  ),
  enriched as (
    select fd.*,
           exists (
             select 1
               from public.saltedge_connections c
               join public.saltedge_customers sc on sc.id = c.customer_id
              where sc.user_id = fd.user_id
                and (p_include_test or sc.mode = 'live')
                and c.linked_at <= fd.redeemed_at
                and (c.revoked_at is null or c.revoked_at > fd.redeemed_at)
           ) as measurable,
           (
             select coalesce(sum(t.amount_cents), 0) / 100
               from public.saltedge_transactions t
               join public.saltedge_connections c on c.id = t.connection_id
               join public.saltedge_customers sc on sc.id = c.customer_id
              where t.user_id = fd.user_id
                and t.matched_venue_id = fd.venue_id
                and t.made_on = fd.day
                and not t.is_refund
                and coalesce(t.match_confidence, 0) >= 0.9
                and (p_include_test or sc.mode = 'live')
           ) as spend_huf,
           not exists (
             select 1
               from public.saltedge_transactions t
              where t.user_id = fd.user_id
                and t.matched_venue_id = fd.venue_id
                and t.made_on < fd.day
                and not t.is_refund
                and coalesce(t.match_confidence, 0) >= 0.9
           ) as first_time_payer,
           (
             exists (
               select 1
                 from public.saltedge_transactions t
                where t.user_id = fd.user_id
                  and t.matched_venue_id = fd.venue_id
                  and t.made_on > fd.day
                  and t.made_on <= fd.day + 30
                  and not t.is_refund
                  and coalesce(t.match_confidence, 0) >= 0.9
             )
             or exists (
               select 1
                 from public.redemptions r2
                where r2.user_id = fd.user_id
                  and r2.venue_id = fd.venue_id
                  and r2.status = 'success'
                  and (r2.redeemed_at at time zone 'Europe/Budapest')::date > fd.day
                  and (r2.redeemed_at at time zone 'Europe/Budapest')::date <= fd.day + 30
             )
           ) as came_back
      from free_drinks fd
  )
  select sv.id,
         sv.name,
         count(e.id),
         count(e.id) filter (where e.measurable),
         count(e.id) filter (where e.measurable and e.spend_huf > 0),
         count(e.id) filter (where e.measurable and e.spend_huf > 0 and e.first_time_payer),
         coalesce(sum(e.spend_huf) filter (where e.measurable), 0)::bigint,
         round(avg(e.spend_huf) filter (where e.measurable and e.spend_huf > 0), 0),
         count(e.id) filter (where e.came_back)
    from scoped_venues sv
    left join enriched e on e.venue_id = sv.id
   group by sv.id, sv.name
   order by count(e.id) desc, sv.name;
end;
$$;

revoke all on function public.get_venue_free_drink_impact(date, date, uuid, boolean) from public, anon;
grant execute on function public.get_venue_free_drink_impact(date, date, uuid, boolean) to authenticated;

-- New users whose first redemption was at the venue, split by who brought them.
create or replace function public.get_venue_acquisition_stats(
  p_from date,
  p_to date,
  p_venue_id uuid default null
)
returns table (
  venue_id uuid,
  venue_name text,
  new_users bigint,
  venue_code_users bigint,
  venue_walk_in_users bigint,
  cgi_users bigint,
  venue_sourced_active_elsewhere bigint
)
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_is_admin boolean := private.is_admin(v_uid);
  v_allowed uuid[] := private.get_user_venue_ids(v_uid);
begin
  if v_uid is null then
    return;
  end if;

  return query
  with scoped_venues as (
    select v.id, v.name
      from public.venues v
     where (v_is_admin or v.id = any (v_allowed))
       and (p_venue_id is null or v.id = p_venue_id)
  ),
  acq as (
    select ua.*
      from public.user_acquisition ua
     where ua.classified_at is not null
       and (ua.first_redemption_at at time zone 'Europe/Budapest')::date between p_from and p_to
       and not private.is_internal_user(ua.user_id)
  )
  select sv.id,
         sv.name,
         count(a.user_id),
         count(a.user_id) filter (where a.source = 'venue_code'),
         count(a.user_id) filter (where a.source = 'venue_walk_in'),
         count(a.user_id) filter (where a.source = 'cgi'),
         count(a.user_id) filter (
           where a.source in ('venue_code', 'venue_walk_in')
             and exists (
               select 1
                 from public.redemptions r
                where r.user_id = a.user_id
                  and r.status = 'success'
                  and r.venue_id <> sv.id
             )
         )
    from scoped_venues sv
    left join acq a on a.venue_id = sv.id
   group by sv.id, sv.name
   order by count(a.user_id) desc, sv.name;
end;
$$;

revoke all on function public.get_venue_acquisition_stats(date, date, uuid) from public, anon;
grant execute on function public.get_venue_acquisition_stats(date, date, uuid) to authenticated;

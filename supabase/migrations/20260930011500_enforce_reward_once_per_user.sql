-- Reward terms promise one redemption per user. Historical duplicate rows must
-- stay intact for accounting and auditability, so a separate claim table keeps
-- one durable lock per user/reward pair. The trigger also protects direct
-- service-role inserts outside the RPC.
create table if not exists public.reward_redemption_claims (
  user_id uuid not null,
  reward_id uuid not null references public.rewards(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  primary key (user_id, reward_id)
);

alter table public.reward_redemption_claims enable row level security;

revoke all on table public.reward_redemption_claims from public, anon, authenticated;
grant select, insert, update, delete on table public.reward_redemption_claims to service_role;

insert into public.reward_redemption_claims (user_id, reward_id, claimed_at)
select user_id, reward_id, min(redeemed_at)
  from public.reward_redemptions
 group by user_id, reward_id
on conflict (user_id, reward_id) do nothing;

create or replace function public.enforce_reward_redemption_once()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.reward_redemption_claims (user_id, reward_id)
  values (new.user_id, new.reward_id);

  return new;
exception
  when unique_violation then
    raise exception using
      errcode = 'P0001',
      message = 'REWARD_ALREADY_REDEEMED';
end;
$$;

revoke all on function public.enforce_reward_redemption_once() from public, anon, authenticated;
grant execute on function public.enforce_reward_redemption_once() to service_role;

drop trigger if exists trg_reward_redemption_once on public.reward_redemptions;
create trigger trg_reward_redemption_once
before insert on public.reward_redemptions
for each row
execute function public.enforce_reward_redemption_once();

create or replace function public.redeem_reward_atomic(
  p_user_id uuid,
  p_reward_id uuid,
  p_redemption_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reward public.rewards%rowtype;
  v_balance integer;
  v_redemption_id uuid;
begin
  if p_user_id is null or p_reward_id is null then
    raise exception 'INVALID_REQUEST';
  end if;

  if p_redemption_code is null or p_redemption_code !~ '^CGI-[A-F0-9]{8}$' then
    raise exception 'INVALID_REDEMPTION_CODE';
  end if;

  select *
    into v_reward
    from public.rewards
   where id = p_reward_id
   for update;

  if not found then
    raise exception 'REWARD_NOT_FOUND';
  end if;
  if not v_reward.active then
    raise exception 'REWARD_INACTIVE';
  end if;
  if v_reward.valid_until < (now() at time zone 'Europe/Budapest')::date then
    raise exception 'REWARD_EXPIRED';
  end if;
  if v_reward.max_redemptions is not null
     and coalesce(v_reward.current_redemptions, 0) >= v_reward.max_redemptions then
    raise exception 'REWARD_LIMIT_REACHED';
  end if;
  if not coalesce(v_reward.is_global, false)
     and not exists (
       select 1
         from public.venues venue
        where venue.id in (v_reward.venue_id, v_reward.partner_id)
          and venue.is_paused = false
     ) then
    raise exception 'REWARD_VENUE_INACTIVE';
  end if;

  if exists (
    select 1
      from public.reward_redemption_claims claim
     where claim.reward_id = v_reward.id
       and claim.user_id = p_user_id
  ) then
    raise exception 'REWARD_ALREADY_REDEEMED';
  end if;

  insert into public.user_points (user_id, balance, lifetime_earned, lifetime_spent, total_spend)
  values (p_user_id, 0, 0, 0, 0)
  on conflict (user_id) do nothing;

  select balance
    into v_balance
    from public.user_points
   where user_id = p_user_id
   for update;

  if coalesce(v_balance, 0) < v_reward.points_required then
    raise exception 'INSUFFICIENT_POINTS';
  end if;

  update public.user_points
     set balance = balance - v_reward.points_required,
         lifetime_spent = lifetime_spent + v_reward.points_required,
         last_transaction_at = now(),
         updated_at = now()
   where user_id = p_user_id
   returning balance into v_balance;

  insert into public.reward_redemptions (reward_id, user_id, venue_id, notes)
  values (v_reward.id, p_user_id, v_reward.venue_id, 'Redemption code: ' || p_redemption_code)
  returning id into v_redemption_id;

  insert into public.points_transactions (
    user_id,
    amount,
    type,
    reference_type,
    reference_id,
    venue_id,
    description
  ) values (
    p_user_id,
    -v_reward.points_required,
    'spend_reward',
    'reward',
    v_reward.id,
    v_reward.venue_id,
    'Beváltás: ' || v_reward.name
  );

  update public.rewards
     set current_redemptions = coalesce(current_redemptions, 0) + 1,
         updated_at = now()
   where id = v_reward.id;

  return jsonb_build_object(
    'redemption_id', v_redemption_id,
    'reward_name', v_reward.name,
    'points_spent', v_reward.points_required,
    'new_balance', v_balance,
    'redemption_code', p_redemption_code
  );
end;
$$;

revoke all on function public.redeem_reward_atomic(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.redeem_reward_atomic(uuid, uuid, text) to service_role;

-- Redeem a points reward in one database transaction. Only the service role
-- may call this function; the Edge Function authenticates the end user first.
create or replace function public.redeem_reward_atomic(
  p_user_id uuid,
  p_reward_id uuid,
  p_redemption_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
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

-- A consumer app must return the same reward catalogue for admins and regular users.
-- Admin RLS policies intentionally expose hidden rows in the Venue Hub, so the app
-- reads through this explicitly filtered, security-invoker view instead.
create or replace view public.consumer_rewards
with (security_invoker = true)
as
select
  r.id,
  r.venue_id,
  r.name,
  r.description,
  r.points_required,
  r.valid_until,
  r.active,
  r.image_url,
  r.category,
  r.is_global,
  r.partner_id,
  r.priority,
  r.terms_conditions,
  r.max_redemptions,
  r.current_redemptions
from public.rewards r
where r.active = true
  and r.valid_until >= (now() at time zone 'Europe/Budapest')::date
  and (
    r.max_redemptions is null
    or coalesce(r.current_redemptions, 0) < r.max_redemptions
  )
  and (
    coalesce(r.is_global, false) = true
    or exists (
      select 1
      from public.venues v
      where v.id = any (array[r.venue_id, r.partner_id])
        and v.is_paused = false
    )
  );

revoke all on public.consumer_rewards from anon;
grant select on public.consumer_rewards to authenticated;

comment on view public.consumer_rewards is
  'Consumer-safe active reward catalogue; filters paused venues even for admin users.';

notify pgrst, 'reload schema';

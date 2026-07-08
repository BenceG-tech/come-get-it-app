-- Fix: admin updates to free drink windows silently failed.
--
-- 1) RLS policies on venues / venue_drinks / free_drink_windows reference the
--    helper function get_user_venue_ids(), but the API roles were never granted
--    EXECUTE on it. Any REST query evaluated under those policies failed with
--    "permission denied for function get_user_venue_ids", which blocked the
--    backend admin save path (including deleting stale time windows).
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'get_user_venue_ids'
  loop
    execute format('grant execute on function %s to anon, authenticated, service_role', fn.signature);
    raise notice 'Granted EXECUTE on % to API roles', fn.signature;
  end loop;
end $$;

-- 2) Clean up stale window rows: windows that point at drinks which no longer
--    exist or are no longer marked as free drinks can never be redeemed and
--    only confuse the eligibility checks.
delete from public.free_drink_windows w
where not exists (
  select 1
  from public.venue_drinks d
  where d.id = w.drink_id
    and coalesce(d.is_free_drink, false) = true
);

-- 3) Windows with an empty/NULL days array can never match any day, so they
--    permanently block a drink that should be redeemable. Remove them.
delete from public.free_drink_windows
where days is null
   or coalesce(array_length(days, 1), 0) = 0;

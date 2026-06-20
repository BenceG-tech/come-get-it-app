-- Come Get It: Vinozza demo readiness
-- Safe to run multiple times. Review coordinates before production use.

alter table if exists public.venues
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6);

create index if not exists venues_latlng_idx on public.venues (latitude, longitude);

update public.venues
set
  coordinates = jsonb_build_object('lat', 47.497200, 'lng', 19.139500),
  latitude = 47.497200,
  longitude = 19.139500
where id = '46e22a84-b299-4896-8b23-4f294e1d3d58';

update public.venues
set
  latitude = nullif((coordinates->>'lat')::numeric, 0),
  longitude = nullif((coordinates->>'lng')::numeric, 0)
where coordinates ? 'lat'
  and coordinates ? 'lng'
  and (latitude is null or longitude is null);

insert into public.venue_drinks (id, venue_id, drink_name, category, is_free_drink, is_sponsored)
select gen_random_uuid(), '46e22a84-b299-4896-8b23-4f294e1d3d58', 'Vinozza demo ital', 'drink', true, false
where not exists (
  select 1
  from public.venue_drinks
  where venue_id = '46e22a84-b299-4896-8b23-4f294e1d3d58'
    and is_free_drink = true
);

insert into public.free_drink_windows (venue_id, days, start_time, end_time, timezone, drink_id)
select
  '46e22a84-b299-4896-8b23-4f294e1d3d58',
  array[1,2,3,4,5,6,7]::int[],
  '00:00'::time,
  '23:59'::time,
  'Europe/Budapest',
  vd.id
from public.venue_drinks vd
where vd.venue_id = '46e22a84-b299-4896-8b23-4f294e1d3d58'
  and vd.is_free_drink = true
  and not exists (
    select 1
    from public.free_drink_windows fw
    where fw.venue_id = '46e22a84-b299-4896-8b23-4f294e1d3d58'
  )
limit 1;

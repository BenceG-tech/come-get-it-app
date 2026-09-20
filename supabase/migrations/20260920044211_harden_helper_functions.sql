-- Restrict SECURITY DEFINER helpers to their intended audience and prevent
-- callers from inspecting another user's role or venue memberships.

create or replace function public.get_user_venue_ids(user_id uuid default auth.uid())
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null or user_id is distinct from auth.uid() then array[]::uuid[]
    else coalesce(
      array(
        select venue_id
        from public.venue_memberships
        where profile_id = auth.uid()
      ),
      array[]::uuid[]
    )
  end;
$$;

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null or user_id is distinct from auth.uid() then false
    else coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
  end;
$$;

create or replace function public.get_public_venues(search_term text default null, limit_count integer default 50)
returns table(
  id uuid,
  name text,
  address text,
  description text,
  plan public.venue_plan,
  phone_number text,
  website_url text,
  is_paused boolean,
  created_at timestamptz,
  image_url text,
  hero_image_url text,
  participates_in_points boolean,
  points_per_visit integer,
  distance double precision,
  google_maps_url text,
  category text,
  price_tier integer,
  rating numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.id,
    v.name,
    v.address,
    v.description,
    v.plan,
    v.phone_number,
    v.website_url,
    v.is_paused,
    v.created_at,
    v.image_url,
    v.hero_image_url,
    v.participates_in_points,
    v.points_per_visit,
    v.distance,
    v.google_maps_url,
    v.category,
    v.price_tier,
    v.rating
  from public.venues v
  where v.is_paused = false
    and (
      search_term is null
      or search_term = ''
      or v.name ilike '%' || search_term || '%'
      or v.address ilike '%' || search_term || '%'
    )
  order by v.display_order asc, v.created_at desc
  limit least(greatest(coalesce(limit_count, 50), 1), 100);
$$;

revoke all on function public.get_user_venue_ids(uuid) from public, anon;
grant execute on function public.get_user_venue_ids(uuid) to authenticated;

revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;

revoke all on function public.get_public_venues(text, integer) from public;
grant execute on function public.get_public_venues(text, integer) to anon, authenticated;

revoke all on function public.is_venue_publicly_active(uuid) from public;
grant execute on function public.is_venue_publicly_active(uuid) to anon, authenticated;

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using ((select public.is_admin()));

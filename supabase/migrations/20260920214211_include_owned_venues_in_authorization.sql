-- Keep venue-scoped RLS consistent with the two supported ownership models:
-- explicit venue_memberships and venues.owner_profile_id.
create or replace function private.get_user_venue_ids(user_id uuid default auth.uid())
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null
      or user_id is distinct from (select auth.uid()) then array[]::uuid[]
    else coalesce(
      array(
        select venue_id
        from (
          select vm.venue_id
            from public.venue_memberships vm
           where vm.profile_id = (select auth.uid())
          union
          select v.id
            from public.venues v
           where v.owner_profile_id = (select auth.uid())
        ) authorized_venues
      ),
      array[]::uuid[]
    )
  end;
$$;

revoke all on function private.get_user_venue_ids(uuid) from public, anon;
grant execute on function private.get_user_venue_ids(uuid) to authenticated, service_role;


-- Keep privileged authorization lookups out of the exposed public schema.
-- The public wrappers remain stable for existing RLS policies, but now run as
-- SECURITY INVOKER and can only delegate to guarded helpers in `private`.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null
      or user_id is distinct from (select auth.uid()) then false
    else coalesce(
      (select p.is_admin
         from public.profiles p
        where p.id = (select auth.uid())),
      false
    )
  end;
$$;

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
        select vm.venue_id
          from public.venue_memberships vm
         where vm.profile_id = (select auth.uid())
      ),
      array[]::uuid[]
    )
  end;
$$;

revoke all on function private.is_admin(uuid) from public, anon;
revoke all on function private.get_user_venue_ids(uuid) from public, anon;
grant execute on function private.is_admin(uuid) to authenticated, service_role;
grant execute on function private.get_user_venue_ids(uuid) to authenticated, service_role;

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_admin(user_id);
$$;

create or replace function public.get_user_venue_ids(user_id uuid default auth.uid())
returns uuid[]
language sql
stable
security invoker
set search_path = ''
as $$
  select private.get_user_venue_ids(user_id);
$$;

revoke all on function public.is_admin(uuid) from public, anon;
revoke all on function public.get_user_venue_ids(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.get_user_venue_ids(uuid) to authenticated, service_role;

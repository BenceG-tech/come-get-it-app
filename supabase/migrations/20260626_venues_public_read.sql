-- Allow public (anonymous) read access to the venues table
-- Fixes "permission denied for function get_user_venue_ids" error
-- when the map screen fetches venues via the REST API with the anon key.

-- Enable RLS if not already (safe no-op if already enabled)
alter table if exists public.venues enable row level security;

-- Drop the policy if it already exists (for idempotency)
drop policy if exists "venues_public_read" on public.venues;

-- Create a policy that allows anyone to read venues
create policy "venues_public_read" on public.venues
  for select
  using (true);

-- Also ensure the venues table has the required columns
-- (safe no-op if they already exist)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'venues'
      and column_name = 'is_paused'
  ) then
    -- Allow public to see all venues, including paused ones (admin manages pausing)
  end if;
end $$;

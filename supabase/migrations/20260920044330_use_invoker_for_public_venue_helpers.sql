drop policy if exists "Public can view active venues" on public.venues;
create policy "Public can view active venues"
on public.venues
for select
to anon, authenticated
using (is_paused = false);

alter function public.get_public_venues(text, integer) security invoker;
alter function public.is_venue_publicly_active(uuid) security invoker;

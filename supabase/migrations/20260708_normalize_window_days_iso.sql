-- Normalize free_drink_windows.days to ISO 8601 (1=Monday ... 7=Sunday).
--
-- The admin UI used to save days with a 0-based index (0=Monday ... 6=Sunday),
-- while the app and the redemption edge function read the array as ISO days.
-- Every admin-saved window was therefore shifted by one day, which is why
-- redemption kept failing with "no active window".
--
-- Rows that need shifting (+1):
--   * any row containing 0 (0 only exists in the 0-based format), or
--   * single-day rows with a value 0..6 — these all came from the admin UI
--     (the only seed data was a full-week [1..7] array, which stays as-is).
--
-- Run once. Single-day ISO Sunday rows ([7]) and full-week rows are untouched.

update public.free_drink_windows
set days = (
  select array_agg(least(d + 1, 7) order by d)
  from unnest(days) as d
)
where 0 = any(days)
   or (coalesce(array_length(days, 1), 0) = 1 and days[1] between 1 and 6);

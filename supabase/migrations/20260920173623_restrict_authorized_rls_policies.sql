-- Policies that depend on a signed-in identity were historically created for
-- PUBLIC. Their predicates denied anonymous access, but targeting every role
-- caused unnecessary policy evaluation and noisy overlapping-policy plans.
-- Keep public catalogue reads on their explicit anon/authenticated policies;
-- narrow identity/admin/venue-membership policies to authenticated callers.

do $migration$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and roles = array['public']::name[]
       and (
         coalesce(qual, '') ~ '(is_admin|get_user_venue_ids|auth\.uid)'
         or coalesce(with_check, '') ~ '(is_admin|get_user_venue_ids|auth\.uid)'
       )
  loop
    execute format(
      'alter policy %I on %I.%I to authenticated',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end
$migration$;

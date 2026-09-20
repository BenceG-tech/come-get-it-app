-- Supabase recommends wrapping auth.uid() in a scalar subquery inside RLS
-- policies. PostgreSQL can then evaluate it once as an initPlan instead of
-- once per candidate row. Preserve every policy's command, role list, and
-- predicate; only rewrite the auth helper call.

do $migration$
declare
  policy_row record;
  using_expression text;
  check_expression text;
  alter_statement text;
begin
  for policy_row in
    select schemaname, tablename, policyname, qual, with_check
      from pg_policies
     where schemaname = 'public'
       and (
         position('auth.uid()' in coalesce(qual, '')) > 0
         or position('auth.uid()' in coalesce(with_check, '')) > 0
       )
  loop
    using_expression := case
      when policy_row.qual is null then null
      else replace(policy_row.qual, 'auth.uid()', '(select auth.uid())')
    end;
    check_expression := case
      when policy_row.with_check is null then null
      else replace(policy_row.with_check, 'auth.uid()', '(select auth.uid())')
    end;

    alter_statement := format(
      'alter policy %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );

    if using_expression is not null then
      alter_statement := alter_statement || ' using (' || using_expression || ')';
    end if;
    if check_expression is not null then
      alter_statement := alter_statement || ' with check (' || check_expression || ')';
    end if;

    execute alter_statement;
  end loop;
end
$migration$;

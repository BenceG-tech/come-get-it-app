-- Consumer cleanup runs inside the Auth API's deletion transaction. A failure
-- rolls back both the identity and all application records.
create schema if not exists private;

-- Legacy test rows may predate accounts; preserve them. NOT VALID enforces
-- every new write and prevents an in-flight request recreating deleted data.
alter table public.user_activity_logs add constraint user_activity_logs_auth_user_fk
  foreign key(user_id) references auth.users(id) on delete cascade not valid;
alter table public.reward_redemptions add constraint reward_redemptions_auth_user_fk
  foreign key(user_id) references auth.users(id) on delete cascade not valid;
alter table public.reward_redemption_claims add constraint reward_redemption_claims_auth_user_fk
  foreign key(user_id) references auth.users(id) on delete cascade not valid;
alter table public.user_tags add constraint user_tags_auth_user_fk
  foreign key(user_id) references auth.users(id) on delete cascade not valid;
alter table public.loyalty_milestones add constraint loyalty_milestones_auth_user_fk
  foreign key(user_id) references auth.users(id) on delete cascade not valid;

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing')),
  reason text not null check (reason in ('business_dependencies','storage_dependencies')),
  requested_at timestamptz not null default now()
);
alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from anon, authenticated;
grant select on public.account_deletion_requests to authenticated;
grant all on public.account_deletion_requests to service_role;
create policy "Read own deletion request or administer requests"
  on public.account_deletion_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create or replace function public.account_deletion_dependencies(target_user_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case
    when exists(select 1 from public.venues where owner_profile_id=target_user_id) then 'business_dependencies'
    when exists(select 1 from storage.objects where owner_id=target_user_id::text) then 'storage_dependencies'
    else null end;
$$;
revoke all on function public.account_deletion_dependencies(uuid) from public, anon, authenticated;
grant execute on function public.account_deletion_dependencies(uuid) to service_role;

create or replace function private.cleanup_deleted_consumer()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Lock the profile against a concurrently assigned business ownership FK.
  perform 1 from public.profiles where id=old.id for update;
  if exists(select 1 from public.venues where owner_profile_id=old.id) then
    raise exception 'Business ownership must be resolved before account deletion';
  end if;
  if exists(select 1 from storage.objects where owner_id=old.id::text) then
    raise exception 'Storage ownership must be resolved before account deletion';
  end if;
  delete from public.csr_donations where user_id=old.id
    or redemption_id in (select id from public.redemptions where user_id=old.id);
  delete from public.notification_logs where user_id=old.id;
  delete from public.ai_notification_suggestions where user_id=old.id;
  update public.ai_notification_suggestions set created_by=null where created_by=old.id;
  update public.notification_templates set created_by=null where created_by=old.id;
  delete from public.redemptions where user_id=old.id;
  delete from public.redemption_tokens where user_id=old.id;
  delete from public.user_activity_logs where user_id=old.id;
  delete from public.reward_redemptions where user_id=old.id;
  delete from public.reward_redemption_claims where user_id=old.id;
  delete from public.loyalty_milestones where user_id=old.id;
  delete from public.user_tags where user_id=old.id;
  update public.user_tags set created_by=null where created_by=old.id;
  update public.fidel_transactions set user_id=null where user_id=old.id;
  update public.pos_transactions set user_id=null where user_id=old.id;
  update public.anomaly_logs set resolved_by=null where resolved_by=old.id;
  update public.autopilot_rules set created_by=null where created_by=old.id;
  update public.platform_settings set updated_by=null where updated_by=old.id;
  update public.report_schedules set created_by=null where created_by=old.id;
  delete from public.audit_logs where actor_id=old.id or (resource_type in ('user','profile') and resource_id=old.id);
  -- profiles, auth sessions, push tokens, points, saved QR, preferences and
  -- acquisition records have verified ON DELETE CASCADE foreign keys.
  return old;
end;
$$;
revoke all on function private.cleanup_deleted_consumer() from public, anon, authenticated;
create trigger cleanup_deleted_consumer before delete on auth.users
  for each row execute function private.cleanup_deleted_consumer();

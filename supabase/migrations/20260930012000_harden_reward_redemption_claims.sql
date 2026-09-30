-- Make the deliberate client deny explicit and cover the reward foreign-key
-- lookup used when a reward is removed.
create index if not exists idx_reward_redemption_claims_reward_id
  on public.reward_redemption_claims (reward_id);

drop policy if exists "Clients cannot access reward redemption claims"
  on public.reward_redemption_claims;

create policy "Clients cannot access reward redemption claims"
on public.reward_redemption_claims
for all
to anon, authenticated
using (false)
with check (false);

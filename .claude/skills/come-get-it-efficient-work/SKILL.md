---
name: come-get-it-efficient-work
description: Work on Come Get It with focused context, reproducible release evidence, and separate pilot/test metrics. Use for this project's mobile, admin, backend, or release work.
---

# Come Get It focused workflow

Identify the relevant checkout before editing: this workspace has several mobile and web copies. Compare branch, commit, working changes and current release evidence; directory names alone are not authoritative. Preserve existing work. Do not edit another active task's checkout without coordinating or using an isolated copy.

## Keep context small

- Begin with `rg --files` and targeted `rg -n` searches. Read the matching function and its direct callers before expanding to entire files.
- Exclude dependencies, binary assets, old output folders and lockfiles from broad searches. Inspect lockfiles only for dependency questions.
- Filter structured tool responses to the fields required for the decision. Store large raw results locally; never dump whole chat histories, account data or tool catalogs into context.
- Read only the active specialist skill and relevant references. Do not preload all installed skills.
- Keep a concise task note: selected repo/commit, verified facts, changed paths, checks, remaining blockers. Reuse it on continuation; verify live state when it matters.
- Use focused tests and one full relevant verification pass. Repeat only after changes, failures or unresolved risks.
- Never trade away correctness, release checks or meaningful user updates for token savings. Do not claim a measured saving without a baseline.

## Project invariants

- Expo mobile, web/admin and Supabase backend are distinct surfaces. Verify each active Supabase project reference from source; multiple Come Get It projects exist.
- Distinguish free-drink QR redemption from points rewards. Keep server-side distance, offer, daily-limit, expiry, single-use and atomic point protections.
- Generate redeemable QR tokens only for an explicit on-site action. Investigate expiry by flow/cohort before changing TTL.
- Pilot reports must state the period, timezone, cohort and denominator. Separate staff, test, review and real users; do not infer real-user behaviour from test redemptions.
- Collect only justified first-party usage fields. Keep privacy declarations consistent with shipped code and provider behaviour; never log raw tokens, passwords or precise coordinates for analytics.
- Release evidence is `source commit → build ID → Apple build number → device checks`. Build completion, TestFlight processing, App Review submission and public release are separate states.
- Report Hungarian user-facing copy naturally and preserve current product decisions. Unknown launch dates stay unknown.

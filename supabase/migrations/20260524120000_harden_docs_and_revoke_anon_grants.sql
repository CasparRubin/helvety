-- Harden public.docs API access (GRANT + authenticated policies) and revoke anon on legacy E2EE tables.

-- A. public.docs — match links privilege pattern
grant select, insert, update, delete on public.docs to authenticated;
grant select, insert, update, delete on public.docs to service_role;
revoke all on public.docs from anon;

drop policy if exists "docs_select_own" on public.docs;
drop policy if exists "docs_insert_own" on public.docs;
drop policy if exists "docs_update_own" on public.docs;
drop policy if exists "docs_delete_own" on public.docs;

create policy "docs_select_own"
  on public.docs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "docs_insert_own"
  on public.docs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "docs_update_own"
  on public.docs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "docs_delete_own"
  on public.docs
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- B. Revoke anon on legacy user-data tables (RLS remains; defense in depth)
revoke all on public.contacts from anon;
revoke all on public.items from anon;
revoke all on public.notes from anon;
revoke all on public.user_profiles from anon;
revoke all on public.user_passkey_params from anon;

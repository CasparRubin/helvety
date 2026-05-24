-- Align public.docs RLS with Supabase recommendation: (select auth.uid()) per policy
-- to avoid per-row re-evaluation (LINT 0003). Semantics unchanged.
-- No-op when 20260523120000_create_docs_table.sql already uses subselect policies + FORCE RLS.

drop policy if exists "docs_select_own" on public.docs;
drop policy if exists "docs_insert_own" on public.docs;
drop policy if exists "docs_update_own" on public.docs;
drop policy if exists "docs_delete_own" on public.docs;

create policy "docs_select_own"
  on public.docs
  for select
  using ((select auth.uid()) = user_id);

create policy "docs_insert_own"
  on public.docs
  for insert
  with check ((select auth.uid()) = user_id);

create policy "docs_update_own"
  on public.docs
  for update
  using ((select auth.uid()) = user_id);

create policy "docs_delete_own"
  on public.docs
  for delete
  using ((select auth.uid()) = user_id);

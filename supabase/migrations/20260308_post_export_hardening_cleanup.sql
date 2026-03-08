-- Post-export hardening cleanup
-- Removes legacy/duplicate policy and trigger artifacts found in schema export.

begin;

-- ---------------------------------------------------------------------------
-- Remove legacy Tasks hierarchy trigger functions (tables already removed)
-- ---------------------------------------------------------------------------
drop function if exists public.check_spaces_row_limit();
drop function if exists public.check_units_row_limit();

-- ---------------------------------------------------------------------------
-- Remove duplicate item-limit trigger (keep canonical check_items_row_limit_trigger)
-- ---------------------------------------------------------------------------
drop trigger if exists enforce_items_limit on public.items;

-- ---------------------------------------------------------------------------
-- Normalize item_contact_links policies to a single authenticated set
-- ---------------------------------------------------------------------------
drop policy if exists "Users can create own item contact links"
  on public.item_contact_links;
drop policy if exists "Users can delete own item contact links"
  on public.item_contact_links;
drop policy if exists "Users can update own item contact links"
  on public.item_contact_links;
drop policy if exists "Users can view own item contact links"
  on public.item_contact_links;
drop policy if exists "Users can delete their own item_contact_links"
  on public.item_contact_links;
drop policy if exists "Users can insert their own item_contact_links"
  on public.item_contact_links;
drop policy if exists "Users can update their own item_contact_links"
  on public.item_contact_links;
drop policy if exists "Users can view their own item_contact_links"
  on public.item_contact_links;

create policy "Users can insert own item_contact_links"
  on public.item_contact_links
  as permissive
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can select own item_contact_links"
  on public.item_contact_links
  as permissive
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own item_contact_links"
  on public.item_contact_links
  as permissive
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own item_contact_links"
  on public.item_contact_links
  as permissive
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;

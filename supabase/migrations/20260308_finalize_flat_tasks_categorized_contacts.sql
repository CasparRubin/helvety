-- Finalize flat Tasks + categorized Contacts model.
-- - Tasks: items + stages only (no units/spaces)
-- - Contacts: contacts + fixed category_id values

begin;

-- ---------------------------------------------------------------------------
-- Remove legacy hierarchy artifacts from Tasks schema
-- ---------------------------------------------------------------------------
drop trigger if exists enforce_items_per_space_limit on public.items;
drop function if exists public.check_items_per_space_limit();

drop table if exists public.entity_contact_links cascade;
drop table if exists public.spaces cascade;
drop table if exists public.units cascade;

alter table public.items
  drop column if exists space_id,
  drop column if exists unit_id;

-- Keep per-user item-cap trigger aligned with flat model.
create or replace function public.check_items_row_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item_count integer;
begin
  select count(*)
  into item_count
  from public.items i
  where i.user_id = new.user_id;

  if item_count >= 250 then
    raise exception 'Item limit reached (max 250 items per user)';
  end if;

  return new;
end;
$$;

drop trigger if exists check_items_row_limit_trigger on public.items;
create trigger check_items_row_limit_trigger
before insert on public.items
for each row
execute function public.check_items_row_limit();

-- ---------------------------------------------------------------------------
-- Ensure item_contact_links exists and remains RLS-protected
-- ---------------------------------------------------------------------------
create table if not exists public.item_contact_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (item_id, contact_id)
);

create index if not exists idx_item_contact_links_user_id
  on public.item_contact_links(user_id);
create index if not exists idx_item_contact_links_item_id
  on public.item_contact_links(item_id);
create index if not exists idx_item_contact_links_contact_id
  on public.item_contact_links(contact_id);

alter table public.item_contact_links enable row level security;

drop policy if exists "Users can view their own item_contact_links"
  on public.item_contact_links;
create policy "Users can view their own item_contact_links"
  on public.item_contact_links
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own item_contact_links"
  on public.item_contact_links;
create policy "Users can insert their own item_contact_links"
  on public.item_contact_links
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own item_contact_links"
  on public.item_contact_links;
create policy "Users can update their own item_contact_links"
  on public.item_contact_links
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own item_contact_links"
  on public.item_contact_links;
create policy "Users can delete their own item_contact_links"
  on public.item_contact_links
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Contacts category_id: required and constrained to fixed categories
-- ---------------------------------------------------------------------------
alter table public.contacts
  add column if not exists category_id text;

update public.contacts
set category_id = 'personal'
where category_id is null or btrim(category_id) = '';

alter table public.contacts
  alter column category_id set default 'personal',
  alter column category_id set not null;

alter table public.contacts
  drop constraint if exists contacts_category_id_check;

alter table public.contacts
  add constraint contacts_category_id_check
  check (category_id in ('personal', 'family', 'work', 'business', 'other'));

create index if not exists idx_contacts_user_category_sort
  on public.contacts(user_id, category_id, sort_order, created_at desc);

commit;

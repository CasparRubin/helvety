-- Helvety Links: tables, integrity, RLS
-- Run once in Supabase SQL Editor, then: SUPABASE_PROJECT_ID=<ref> bun run db:gen-types

begin;

create table public.link_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_folder_id uuid references public.link_folders (id) on delete cascade,
  encrypted_name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint link_folders_no_self_parent check (
    parent_folder_id is null or parent_folder_id <> id
  )
);

create index link_folders_user_id_idx on public.link_folders (user_id);
create index link_folders_user_parent_idx on public.link_folders (user_id, parent_folder_id);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid references public.link_folders (id) on delete cascade,
  encrypted_name text not null,
  encrypted_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index links_user_id_idx on public.links (user_id);
create index links_user_folder_idx on public.links (user_id, folder_id);

create or replace function public.set_link_folders_updated_at()
returns trigger language plpgsql
set search_path to pg_catalog, public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_links_updated_at()
returns trigger language plpgsql
set search_path to pg_catalog, public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger link_folders_set_updated_at
  before update on public.link_folders
  for each row execute function public.set_link_folders_updated_at();

create trigger links_set_updated_at
  before update on public.links
  for each row execute function public.set_links_updated_at();

create or replace function public.enforce_link_folder_parent_owned()
returns trigger language plpgsql
set search_path to pg_catalog, public
as $$
begin
  if new.parent_folder_id is not null and not exists (
    select 1 from public.link_folders p
    where p.id = new.parent_folder_id and p.user_id = new.user_id
  ) then
    raise exception 'link_folder_parent_not_owned';
  end if;
  return new;
end;
$$;

create trigger link_folders_parent_owned
  before insert or update of parent_folder_id, user_id on public.link_folders
  for each row execute function public.enforce_link_folder_parent_owned();

create or replace function public.enforce_link_folder_no_cycle()
returns trigger language plpgsql
set search_path to pg_catalog, public
as $$
begin
  if new.parent_folder_id is null then
    return new;
  end if;
  if exists (
    with recursive ancestors as (
      select f.id, f.parent_folder_id
      from public.link_folders f
      where f.id = new.parent_folder_id and f.user_id = new.user_id
      union all
      select f.id, f.parent_folder_id
      from public.link_folders f
      join ancestors a on f.id = a.parent_folder_id
      where f.user_id = new.user_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'link_folder_cycle_detected';
  end if;
  return new;
end;
$$;

create trigger link_folders_no_cycle
  before insert or update of parent_folder_id on public.link_folders
  for each row execute function public.enforce_link_folder_no_cycle();

create or replace function public.enforce_links_folder_owned()
returns trigger language plpgsql
set search_path to pg_catalog, public
as $$
begin
  if new.folder_id is not null and not exists (
    select 1 from public.link_folders f
    where f.id = new.folder_id and f.user_id = new.user_id
  ) then
    raise exception 'links_folder_not_owned';
  end if;
  return new;
end;
$$;

create trigger links_folder_owned
  before insert or update of folder_id, user_id on public.links
  for each row execute function public.enforce_links_folder_owned();

create or replace function public.check_link_folders_row_limit()
returns trigger language plpgsql set search_path to '' as $$
begin
  if (select count(*) from public.link_folders where user_id = new.user_id) >= 250 then
    raise exception 'link_folders_row_limit_exceeded';
  end if;
  return new;
end;
$$;

create or replace function public.check_links_row_limit()
returns trigger language plpgsql set search_path to '' as $$
begin
  if (select count(*) from public.links where user_id = new.user_id) >= 250 then
    raise exception 'links_row_limit_exceeded';
  end if;
  return new;
end;
$$;

create trigger link_folders_row_limit_trigger
  before insert on public.link_folders
  for each row execute function public.check_link_folders_row_limit();

create trigger links_row_limit_trigger
  before insert on public.links
  for each row execute function public.check_links_row_limit();

alter table public.link_folders enable row level security;
alter table public.link_folders force row level security;
alter table public.links enable row level security;
alter table public.links force row level security;

create policy "Users can view own link folders" on public.link_folders
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own link folders" on public.link_folders
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own link folders" on public.link_folders
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own link folders" on public.link_folders
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can view own links" on public.links
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own links" on public.links
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own links" on public.links
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own links" on public.links
  for delete to authenticated using ((select auth.uid()) = user_id);

commit;

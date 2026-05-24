-- Helvety Docs: encrypted vault storage for document titles and .docx blobs (client-side encryption before insert).
create table public.docs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  encrypted_title text not null,
  encrypted_docx text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.docs enable row level security;
alter table public.docs force row level security;

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

create index docs_user_updated_idx on public.docs (user_id, updated_at desc);

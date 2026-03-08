-- Remove redundant single-column indexes that duplicate existing *_id indexes.
-- Keeps query plans unchanged while reducing write amplification and index bloat.

drop index if exists public.idx_item_contact_links_contact;
drop index if exists public.idx_item_contact_links_item;
drop index if exists public.idx_item_contact_links_user;

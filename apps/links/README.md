# Helvety Links

End-to-end encrypted bookmarks with nested folders.

**App URL:** https://helvety.com/links  
**Monorepo path:** `apps/links`

## Key Features

- Client-side encryption for link name and URL
- Nested folders (adjacency list; no fixed depth limit; up to 250 folders and 250 links per account)
- Client-side search on decrypted library
- Client-side decrypted export

## E2EE Data Model

Encrypted fields:

- Folder: `name`
- Link: `name`, `url`

Plaintext structural fields:

- `id`, `user_id`, `parent_folder_id`, `folder_id`, `sort_order`, timestamps

## Database

Run [supabase/create_links_tables.sql](../../supabase/create_links_tables.sql) in Supabase SQL Editor, then `bun run db:gen-types` from the repo root.

## Development

```bash
bun run dev
bun run test
```

From repo root gateway: http://localhost:3001/links

## Legal and abuse reporting

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>

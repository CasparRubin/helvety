# Supabase Database Schema

This folder contains a complete, machine-readable export of our production database schema. Yes, it's public. On purpose.

## Why publish your database schema?

We believe security should never depend on obscurity. Our database is protected by multiple independent layers:

- **Row Level Security (RLS)** on every user-facing table, enforcing strict per-user isolation
- **Passkey-based authentication** -- no passwords to phish, brute-force, or credential-stuff
- **End-to-end encryption (E2EE)** -- all sensitive data is encrypted client-side before it ever reaches the database; even we can't read it
- **CSRF protection and rate limiting** on all server actions

With these defenses in place, publishing the schema changes nothing for an attacker -- but it changes everything for transparency. Anyone can verify that we practice what we preach: your data is yours, encrypted, and isolated.

## What's in here

| File              | Purpose                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `supabase.json`   | Full schema export -- tables, columns, constraints, RLS policies, indexes, functions, triggers, views, storage config, and more. One file, everything you need to understand the database. |
| `getSupabase.sql` | The SQL script that generates the export. Run it in the Supabase SQL Editor to produce a fresh `supabase.json`.                                                                            |

## Keeping it current

After any schema migration, re-run `getSupabase.sql` in the Supabase SQL Editor and replace `supabase.json` with the new output. This ensures the published schema always reflects production.

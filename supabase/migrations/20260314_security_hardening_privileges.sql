-- Security hardening migration (least privilege)
-- - Tightens default privileges in app-facing schemas.
-- - Restricts risky function execute grants.
-- - Reduces direct service_role access to Vault secret surfaces.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Default privileges: remove broad grants for future objects
-- ---------------------------------------------------------------------------

-- postgres-owned future objects in public/storage
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL ON FUNCTIONS FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage
REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage
REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage
REVOKE ALL ON FUNCTIONS FROM anon, authenticated, service_role;

-- supabase_admin-owned future objects in public/storage
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
REVOKE ALL ON FUNCTIONS FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA storage
REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA storage
REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA storage
REVOKE ALL ON FUNCTIONS FROM anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2) Function hardening: storage.delete_leaf_prefixes
-- ---------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION storage.delete_leaf_prefixes(text[], text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION storage.delete_leaf_prefixes(text[], text[]) TO supabase_storage_admin;
ALTER FUNCTION storage.delete_leaf_prefixes(text[], text[])
SET search_path = pg_catalog, storage;

-- Defense-in-depth hardening for application trigger function search_path.
ALTER FUNCTION public.check_notes_row_limit()
SET search_path = pg_catalog, public;

-- ---------------------------------------------------------------------------
-- 3) Vault exposure reduction for service_role
-- ---------------------------------------------------------------------------

REVOKE ALL PRIVILEGES ON TABLE vault.secrets FROM service_role;
REVOKE ALL PRIVILEGES ON TABLE vault.decrypted_secrets FROM service_role;

COMMIT;

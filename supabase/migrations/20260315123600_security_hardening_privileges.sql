-- Security hardening: restrict dangerous default privileges on high-risk paths.
-- Keep this migration as an auditable artifact checked by tests.

REVOKE EXECUTE ON FUNCTION storage.delete_leaf_prefixes(text[], text[]) FROM PUBLIC;

ALTER FUNCTION storage.delete_leaf_prefixes(text[], text[])
  SECURITY DEFINER
  SET search_path = storage, pg_temp;

REVOKE ALL PRIVILEGES ON TABLE vault.secrets FROM service_role;
REVOKE ALL PRIVILEGES ON TABLE vault.decrypted_secrets FROM service_role;

-- Key check value (KCV) for validating passkey-derived master keys on unlock.
-- JSON-encoded; generated client-side after PRF derivation. Nullable for existing rows.
ALTER TABLE public.user_passkey_params
  ADD COLUMN IF NOT EXISTS key_check_value text;

COMMENT ON COLUMN public.user_passkey_params.key_check_value IS
  'Client-generated key check value (JSON) to detect wrong passkey on unlock.';

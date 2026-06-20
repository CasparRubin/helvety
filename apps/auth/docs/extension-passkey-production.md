# Extension auth API — production setup

Chromium extension sign-in and unlock call Bearer/public JSON routes on **`https://helvety.com/auth/api/extension/`**:

| Route                                 | Auth                          | Purpose                                                                                                                                                                                                       |
| ------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/extension/otp/send`        | Public (allowlisted `origin`) | Send email OTP after EU/EEA attestation                                                                                                                                                                       |
| `POST /api/extension/otp/verify`      | Public (allowlisted `origin`) | Verify OTP; returns session tokens (`setSession`: refresh in `chrome.storage.local`, access token mirrored to `chrome.storage.session`); records weekly OTP anchor in `helvety_extension_last_email_verified` |
| `POST /api/extension/passkey/options` | Bearer JWT                    | WebAuthn options + signed challenge envelope                                                                                                                                                                  |
| `POST /api/extension/passkey/verify`  | Bearer JWT                    | Verify passkey assertion (no new session)                                                                                                                                                                     |

Implementation: `lib/extension-otp.ts`, `lib/otp-send-verify-core.ts`, `lib/extension-passkey.ts`, `app/api/extension/`.

## 1. Deploy `helvety-auth`

Vercel project **`helvety-auth`**, root **`apps/auth`**, branch **`main`**.

Confirm after deploy:

```bash
curl -sS -w "\n%{http_code}\n" -X POST \
  "https://helvety.com/auth/api/extension/passkey/options" \
  -H "Content-Type: application/json" \
  -d '{"origin":"chrome-extension://kjdldfioiofpblkchjodefakpopmkjjf","isMobile":false,"expectedUserId":"00000000-0000-4000-8000-000000000001"}'
```

- **Good:** HTTP `401` and JSON `{"success":false,"error":"Not authenticated"}` (or similar) — routes exist.
- **Bad:** HTTP `404` or HTML — extension shows “Passkey API is not deployed…” (check gateway `AUTH_URL` and `helvety-auth` deploy).
- **After sign-in:** JSON `400` with an allowlist message means routes work but **`HELVETY_CHROME_EXTENSION_ORIGINS`** is missing your runtime extension id (copy from extension About tab).

## 2. Set `HELVETY_CHROME_EXTENSION_ORIGINS` (Production)

In Vercel → **helvety-auth** → Settings → Environment Variables → **Production**:

```text
HELVETY_CHROME_EXTENSION_ORIGINS=kjdldfioiofpblkchjodefakpopmkjjf
```

Use your runtime id from `edge://extensions/?id=…` or `chrome://extensions`. Add comma-separated ids for Chrome unpacked, Web Store build, etc. Legacy full URLs (`chrome-extension://<id>`) still work.

Redeploy after changing env.

## 3. Trusted client IP (production rate limiting)

Extension auth routes (OTP and passkey) derive the rate-limit key from **`x-real-ip`** via `getTrustedClientIp` with `requireTrustedProxyInProduction: true`. On Vercel, the platform sets `x-real-ip` for edge requests; without a trusted proxy IP the routes **fail closed** on strict rate-limit paths rather than falling back to spoofable client headers.

After deploy, confirm production requests reach the OTP and passkey routes with a non-null trusted IP (spot-check Upstash rate-limit decisions or auth logs if sign-in or passkey unlock is unexpectedly rejected).

## 4. Extension client

Build without `VITE_HELVETY_AUTH_ORIGIN` (defaults to `https://helvety.com/auth`). Load unpacked `dist/` in Edge or Chrome (114+), then click the Helvety toolbar icon to open the **side panel**.

See [helvety-browser-extension-chromium `docs/webauthn-extension.md`](https://github.com/CasparRubin/helvety-browser-extension-chromium/blob/main/docs/webauthn-extension.md).

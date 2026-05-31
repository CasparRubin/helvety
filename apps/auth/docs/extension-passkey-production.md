# Extension passkey API — production setup

Chromium extension unlock calls **`https://helvety.com/auth/api/extension/passkey/options`** and **`/verify`** with the user’s Supabase JWT (OTP sign-in in the extension). Routes live in this app under `app/api/extension/passkey/`.

## 1. Deploy `helvety-auth`

Vercel project **`helvety-auth`**, root **`apps/auth`**, branch **`main`**.

Confirm after deploy:

```bash
curl -sS -w "\n%{http_code}\n" -X POST \
  "https://helvety.com/auth/api/extension/passkey/options" \
  -H "Content-Type: application/json" \
  -d '{"origin":"chrome-extension://kjdldfioiofpblkchjodefakpopmkjjf","isMobile":false,"expectedUserId":"00000000-0000-4000-8000-000000000001"}'
```

- **Good:** HTTP `401` and JSON `{"success":false,"error":"Not authenticated"}` (or similar).
- **Bad:** HTTP `404` or HTML — extension shows “Passkey API is not deployed…”.

## 2. Set `HELVETY_CHROME_EXTENSION_ORIGINS` (Production)

In Vercel → **helvety-auth** → Settings → Environment Variables → **Production**:

```text
HELVETY_CHROME_EXTENSION_ORIGINS=kjdldfioiofpblkchjodefakpopmkjjf
```

Use your runtime id from `edge://extensions/?id=…` or `chrome://extensions`. Add comma-separated ids for Chrome unpacked, Web Store build, etc. Legacy full URLs (`chrome-extension://<id>`) still work.

Redeploy after changing env.

## 3. Extension client

Build without `VITE_HELVETY_AUTH_ORIGIN` (defaults to `https://helvety.com/auth`). Load unpacked `dist/` in Edge or Chrome.

See [helvety-browser-extension-chromium `docs/webauthn-extension.md`](https://github.com/CasparRubin/helvety-browser-extension-chromium/blob/main/docs/webauthn-extension.md).

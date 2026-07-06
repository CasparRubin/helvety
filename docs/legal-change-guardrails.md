# Legal Change Guardrails

This document defines release guardrails for statements in shared legal pages
(`helvety.com/privacy`, `helvety.com/terms`, `helvety.com/impressum`).

## Why this exists

Helvety legal pages are shared across multiple apps. A technical change in one
app can make legal language inaccurate for all services if not reviewed.

## Mandatory legal-review triggers

Before release, perform legal/content review if any change introduces one of
the following:

- server-side processing of files or content that previously stayed local-only
  (for example Image Upscaler or PDF payload handling)
- AI training, fine-tuning, or dataset retention using user-provided content
- material changes to tracking or profiling scope (including new cookies/localStorage keys, or shared footer disclosure text)
- changes to account/login requirements for public tools
- new Helvety browser-extension auth surfaces (for example extension OTP APIs (`/api/extension/otp/*`), extension passkey APIs, allowlisted Chromium extension ids via `HELVETY_CHROME_EXTENSION_ORIGINS`, bearer-token scope, or server-minted `weekly_proof` / `helvety_extension_weekly_proof` storage)
- active EU/EEA market targeting, localized campaigns, or equivalent
  jurisdiction-focused expansion
- new subprocessors or changed cross-border transfer patterns

## Required update scope when a trigger applies

At minimum, review and update all of:

- `apps/web/app/privacy/page.tsx`
- `apps/web/app/terms/page.tsx`
- `apps/web/app/impressum/page.tsx`
- app-specific product/legal-facing copy (for example:
  `packages/shared/src/helvety-ecosystem-sections.ts`,
  `packages/shared/src/store-catalog.ts`, `apps/store/lib/data/products.ts`,
  `apps/*/lib/product-copy.ts`, `apps/*/public/manifest.json` install
  descriptions, `apps/*/public/llms.txt` summaries, app `README.md`, navbar/about
  text; see `docs/naming-conventions.md` › Customer-facing product copy)
- [`docs/cookies-telemetry-and-footer.md`](./cookies-telemetry-and-footer.md) when cookie, storage, analytics, or footer behavior changes

## Verification checklist

- license and open-source claims match `LICENSE`, `packages/shared/src/licensing.ts`,
  legal pages, Store product About copy, and `public/llms.txt` **`## Licensing`** sections
  (run `bun run consistency:license` and shared copy guardrail tests). App SEO metadata,
  PWA manifests, `llms.txt` taglines, and `package.json` `description` fields stay
  product-focused and must not market AGPL (SPDX `"license"` fields are unchanged).
- claims about local vs server processing match runtime behavior
- claims about no training/no retention are technically true
- login/account requirement claims match actual access flow
- telemetry/security endpoint descriptions match actual payload types
- Privacy §9 cookie/storage disclosure matches [`apps/web/lib/legal-cookies-disclosure.ts`](../apps/web/lib/legal-cookies-disclosure.ts); footer copy matches [`packages/ui/src/footer.tsx`](../packages/ui/src/footer.tsx) (`bun run test` in `apps/web` for `legal-cookies-disclosure`, `legal-metadata`, `legal-privacy-tables`, `legal-e2ee-products`)
- Extension vs web weekly re-auth copy stays accurate in maintainer docs (`packages/shared/src/auth-extension-copy-guardrails.test.ts`): web uses HttpOnly `helvety_device_trust`; Chromium extension uses server-HMAC `weekly_proof` in `helvety_extension_weekly_proof` and `X-Helvety-Weekly-Proof` on Bearer routes (not the web cookie)
- When legal page body copy changes, bump `lastReviewed` on **all three** pages (`privacy`, `terms`, `impressum`) to the same date (`legal-metadata.test.ts` enforces parity)
- CH-first/non-EU-targeting language is consistent wherever referenced

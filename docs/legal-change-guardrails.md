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
- material changes to telemetry, tracking, or profiling scope
- changes to account/login requirements for public tools
- active EU/EEA market targeting, localized campaigns, or equivalent
  jurisdiction-focused expansion
- new subprocessors or changed cross-border transfer patterns

## Required update scope when a trigger applies

At minimum, review and update all of:

- `apps/web/app/privacy/page.tsx`
- `apps/web/app/terms/page.tsx`
- `apps/web/app/impressum/page.tsx`
- app-specific product/legal-facing copy (for example:
  `packages/shared/src/store-catalog.ts`, `apps/store/lib/data/products.ts`,
  `apps/*/lib/product-copy.ts`, `apps/*/public/manifest.json` install
  descriptions, `apps/*/public/llms.txt` summaries, app `README.md`, navbar/about
  text; see `docs/naming-conventions.md` › Customer-facing product copy)

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
- CH-first/non-EU-targeting language is consistent wherever referenced

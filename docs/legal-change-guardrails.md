# Legal Change Guardrails

Release guardrails for shared legal pages
(`helvety.com/privacy`, `helvety.com/terms`, `helvety.com/impressum`).

## Why this exists

Helvety legal pages cover public browser tools, the Store catalog, and
separately distributed products that link here. A technical change can make
legal language inaccurate if not reviewed.

## Mandatory legal-review triggers

Before release, review legal/content if a change introduces:

- server-side processing of files that previously stayed local-only
  (Helvety PDF, Image Editor, or OCR)
- AI training, fine-tuning, or dataset retention using user-provided content
- material changes to tracking or profiling (new cookies/localStorage keys, or
  shared footer disclosure text)
- new login or account requirements for public tools
- active EU/EEA market targeting or equivalent expansion
- new subprocessors or changed cross-border transfer patterns

## Required update scope when a trigger applies

At minimum, review and update:

- `apps/web/app/privacy/page.tsx`
- `apps/web/app/terms/page.tsx`
- `apps/web/app/impressum/page.tsx`
- product-facing copy (for example
  `packages/shared/src/helvety-ecosystem-sections.ts`,
  `packages/shared/src/store-catalog.ts`, `apps/store/lib/data/products.ts`,
  `apps/*/lib/product-copy.ts`, manifests, `llms.txt`, READMEs)
- [`docs/cookies-telemetry-and-footer.md`](./cookies-telemetry-and-footer.md)
  when storage, analytics, or footer behavior changes

## Verification checklist

- license claims match `LICENSE`, `packages/shared/src/licensing.ts`, legal
  pages, Store About copy, and `public/llms.txt` `## Licensing` sections
  (`bun run consistency:license` and shared copy guardrail tests)
- local vs server processing claims match runtime behavior
- no-training / no-retention claims remain true
- no-account claims for public tools match actual access flow
- Privacy cookies section matches
  [`apps/web/lib/legal-cookies-disclosure.ts`](../apps/web/lib/legal-cookies-disclosure.ts);
  footer matches [`packages/ui/src/footer.tsx`](../packages/ui/src/footer.tsx)
  (`bun run test` in `apps/web` for `legal-cookies-disclosure`,
  `legal-metadata`, `legal-privacy-tables`, `legal-public-tools`,
  `legal-document`)
- When legal body copy changes, bump `lastReviewed` on **all legal pages**
  (impressum, privacy, terms) to the same date (`legal-metadata.test.ts`)
- CH-first / not-offered-in-EU-EEA language stays consistent

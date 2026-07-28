# Vercel environment audit checklist

See also [`security-review-runbook.md`](./security-review-runbook.md) for the full periodic review cadence and [`security-audit-2026-06-13.md`](./security-audit-2026-06-13.md) for the 2026-06-13 audit archive (current dependency pins: [`dependency-inventory.md`](./dependency-inventory.md)).

Use this when syncing **Production** and **Preview** env in the Vercel dashboard. Local parity: `bun run consistency:local-env`. Template guardrails: `bun run consistency:env-templates`. Automated audits (requires Vercel CLI login): `bun run consistency:vercel-prod-env` and `bun run consistency:vercel-preview-env` ([`scripts/audit-vercel-production-env.mjs`](../scripts/audit-vercel-production-env.mjs); add `--preview` for Preview tier).

All **five** zone projects on team **Helvety**: `helvety-com`, `helvety-store`, `helvety-pdf`, `helvety-image-editor`, `helvety-ocr`.

## Per-project keys

| Vercel project         | Root Directory      | Set these                                                                    | Do not set (examples)                        |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| `helvety-com`          | `apps/web`          | Gateway `*_URL` vars (`STORE_URL`, `PDF_URL`, `IMAGE_EDITOR_URL`, `OCR_URL`) | Secrets not required by the gateway template |
| `helvety-store`        | `apps/store`        | Keys from `apps/store/env.template`                                          | Keys not listed on that template             |
| `helvety-pdf`          | `apps/pdf`          | Keys from `apps/pdf/env.template`                                            | Keys not listed on that template             |
| `helvety-image-editor` | `apps/image-editor` | Keys from `apps/image-editor/env.template`                                   | Keys not listed on that template             |
| `helvety-ocr`          | `apps/ocr`          | Keys from `apps/ocr/env.template`                                            | Keys not listed on that template             |

Copy exact key names and comments from each zone’s `apps/<slug>/env.template`.

## Shared values

- Upstash secrets only on zones whose `env.template` still lists them (Store downloads)
- Gateway rewrite URLs on `helvety-com` must point at the four non-gateway zone deployments

## Operator checks (keep current)

| Check                                                                    | Notes                                                                  |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `bun run consistency:env-templates` / `consistency:vercel-apps`          | Templates and Vercel project wiring                                    |
| `bun run consistency:local-env`                                          | Local `.env.local` vs templates                                        |
| `bun run consistency:vercel-prod-env` / `consistency:vercel-preview-env` | Requires Vercel CLI login                                              |
| Vercel Web Analytics / Speed Insights                                    | Keep disabled; do not set `NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS`       |
| Gateway rewrite smoke                                                    | `helvety.com/store`, `/pdf`, `/image-editor`, `/ocr` after URL changes |

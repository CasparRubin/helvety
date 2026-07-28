# Helvety monorepo documentation

Index of policy, ops, and architecture docs under this folder.

## Contributors and new zones

| Document                                                                   | Purpose                                                                                        |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [`naming-conventions.md`](./naming-conventions.md)                         | File/symbol naming, App Router conventions, customer-facing copy sync                          |
| [`app-consistency-checklist.md`](./app-consistency-checklist.md)           | Required files and tests for each `apps/*` zone                                                |
| [`ui-shadcn-integration-policy.md`](./ui-shadcn-integration-policy.md)     | Shared UI primitives in `@helvety/ui` only; React Bits vendor rules                            |
| [`ui-action-button-contract.md`](./ui-action-button-contract.md)           | Row actions, canvas tool command bars, placement, responsive labels (`consistency:ui-actions`) |
| [`quality-modernization-baseline.md`](./quality-modernization-baseline.md) | Shared package contracts, proxy/env baselines, completed modernization                         |

## Deploy and Vercel ops

| Document                                                           | Purpose                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [`turbo-env-tiers.md`](./turbo-env-tiers.md)                       | Turbo `build.env` superset vs runtime env tiers                               |
| [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md) | Step-by-step Vercel Production/Preview env per project                        |
| [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md)             | Vercel project ↔ `apps/<slug>` mapping, gateway rewrites, Root Directory trap |

## Release and security review

| Document                                                         | Purpose                                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`security-review-runbook.md`](./security-review-runbook.md)     | Periodic security review cadence (`ci:check`, Vercel env)                                |
| [`security-audit-2026-06-13.md`](./security-audit-2026-06-13.md) | Point-in-time audit archive (2026-06-13); see `dependency-inventory.md` for current pins |
| [`dependency-inventory.md`](./dependency-inventory.md)           | Extended pins (workers, vendors, toolchain) for dependency sweeps                        |

## Legal, cookies, and footer

| Document                                                               | Purpose                                                                           |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`cookies-telemetry-and-footer.md`](./cookies-telemetry-and-footer.md) | Developer reference for footer and first-party cookies (no third-party analytics) |
| [`legal-change-guardrails.md`](./legal-change-guardrails.md)           | When legal pages must be re-reviewed before release                               |

## Related docs outside this folder

- Root hub: [`README.md`](../README.md) (getting started, env model, automation)
- Per-zone READMEs: [`apps/*/README.md`](../apps/)
- Package READMEs: [`packages/*/README.md`](../packages/) (including [`packages/brand`](../packages/brand/README.md) and [`packages/config`](../packages/config/README.md))
- OCR Tesseract assets and language data: [`apps/ocr/README.md`](../apps/ocr/README.md) (Tesseract assets and language data section)

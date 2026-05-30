/**
 * Single source of truth for post-removal analytics guardrails (env keys, stale
 * disclosure copy, legacy gateway rewrite markers). Used by legal tests, env
 * templates, and layout wiring tests.
 *
 * Values are defined in `analytics-guardrails.mjs` for Node script imports.
 */

export {
  HELVETY_FORBIDDEN_ANALYTICS_CODE_MARKERS,
  HELVETY_FORBIDDEN_ANALYTICS_ENV_KEYS,
  HELVETY_LEGACY_GATEWAY_ANALYTICS_REWRITE_MARKERS,
  HELVETY_STALE_ANALYTICS_CODE_MARKERS_IN_DOCS,
  HELVETY_STALE_COOKIE_DOC_PHRASES,
  HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES,
  HELVETY_STALE_TRACKING_PHRASE_DOC_EXCLUSIONS,
} from "./analytics-guardrails.mjs";

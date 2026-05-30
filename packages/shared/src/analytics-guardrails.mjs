/**
 * Runtime source for analytics guardrails (Node scripts import this `.mjs` file).
 * TypeScript consumers use `analytics-guardrails.ts`, which re-exports from here.
 */

/** @type {readonly string[]} */
export const HELVETY_FORBIDDEN_ANALYTICS_ENV_KEYS = [
  "NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS",
  "NEXT_PUBLIC_VERCEL_ANALYTICS_ID",
  "VERCEL_ANALYTICS_ID",
];

/** @type {readonly string[]} */
export const HELVETY_LEGACY_GATEWAY_ANALYTICS_REWRITE_MARKERS = [
  "analyticsId",
  "script.js",
];

/** @type {readonly string[]} */
export const HELVETY_FORBIDDEN_ANALYTICS_CODE_MARKERS = [
  "@vercel/analytics",
  "@vercel/speed-insights",
  "HelvetyVercelAnalytics",
  "with-speed-insights",
  "zone-analytics-referer",
  "./vercel-analytics",
  "analyticsId",
];

/** @type {readonly string[]} */
export const HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES = [
  "Vercel Analytics",
  "Speed Insights",
  "HelvetyVercelAnalytics",
  "HelvetyVercelAnalyticsWithSpeedInsights",
  "NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS",
  "NEXT_PUBLIC_VERCEL_ANALYTICS_ID",
  "VERCEL_ANALYTICS_ID",
  "with-speed-insights",
  "vercel.com/docs/analytics",
  "va.vercel-scripts.com",
  "zone-analytics-referer",
  "@vercel/analytics",
  "@vercel/speed-insights",
  "./vercel-analytics",
  "enable Web Analytics",
  "all Helvety web zones served at",
  "selected Helvety web surfaces",
  "privacy-focused analytics",
  "analytics and other storage",
];

/** @type {readonly string[]} */
export const HELVETY_STALE_COOKIE_DOC_PHRASES = [
  "account-based services also use authentication cookies",
  "similar storage technologies for security and core functionality; account-based",
  "Preference cookies:",
];

/** @type {readonly string[]} */
export const HELVETY_STALE_TRACKING_PHRASE_DOC_EXCLUSIONS = [
  "docs/env-vercel-audit-checklist.md",
];

/** @type {readonly string[]} */
export const HELVETY_STALE_ANALYTICS_CODE_MARKERS_IN_DOCS = [
  "HelvetyVercelAnalytics",
  "HelvetyVercelAnalyticsWithSpeedInsights",
  "with-speed-insights",
  "@vercel/analytics",
  "@vercel/speed-insights",
  "./vercel-analytics",
  "zone-analytics-referer",
  "privacy-focused analytics",
  "analytics and other storage",
  "all Helvety web zones served at",
  "selected Helvety web surfaces",
];

/**
 * Shared Vercel Analytics mounts for all Helvety Next.js zones.
 * Sub-zone pages on helvety.com load `/<deployment-id>/script.js` at the gateway;
 * each zone's Vercel project must have Web Analytics enabled for that script to exist.
 */
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/** When `"false"`, shared root layouts skip mounting analytics (local dev without gateway proxy). */
export function isHelvetyVercelAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS !== "false";
}

/**
 * Shared Vercel analytics mount for Helvety web app packages in this monorepo.
 * Skips render when {@link isHelvetyVercelAnalyticsEnabled} is false.
 */
export function HelvetyVercelAnalytics(): React.JSX.Element | null {
  if (!isHelvetyVercelAnalyticsEnabled()) {
    return null;
  }
  return <Analytics />;
}

/**
 * Web-only mount that adds Speed Insights on top of Analytics.
 * Keep this restricted to helvety.com unless explicitly needed elsewhere.
 */
export function HelvetyVercelAnalyticsWithSpeedInsights(): React.JSX.Element | null {
  if (!isHelvetyVercelAnalyticsEnabled()) {
    return null;
  }
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

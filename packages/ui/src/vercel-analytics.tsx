import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Shared Vercel analytics mount for Helvety web app packages in this monorepo.
 */
export function VercelAnalytics(): React.JSX.Element {
  return <Analytics />;
}

/**
 * Web-only mount that adds Speed Insights on top of Analytics.
 * Keep this restricted to helvety.com unless explicitly needed elsewhere.
 */
export function VercelAnalyticsWithSpeedInsights(): React.JSX.Element {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

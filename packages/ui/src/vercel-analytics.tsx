import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Shared Vercel observability mount for all apps.
 * Keeping this centralized avoids drift between app layouts.
 */
export function VercelAnalytics(): React.JSX.Element {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

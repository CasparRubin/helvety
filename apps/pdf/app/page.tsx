import { PageClient } from "./page-client";

/**
 * Main page - server component
 * No login or account required. As of February 28, 2026, Helvety PDF is
 * available at no cost with a 100MB per-file limit.
 */
export default function Page(): React.JSX.Element {
  return <PageClient />;
}

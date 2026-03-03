import { PageClient } from "./page-client";

/**
 * Main page - server component
 * No login or account required. Helvety PDF is currently available at no cost
 * with a 100MB per-file limit.
 */
export default function Page(): React.JSX.Element {
  return <PageClient />;
}

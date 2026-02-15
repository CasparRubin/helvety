import { PageClient } from "./page-client";

/**
 * Main page - server component
 * No login or account required. Helvety PDF is a free tool, up to 100MB per file.
 */
export default function Page(): React.JSX.Element {
  return <PageClient />;
}

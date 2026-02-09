import { PageClient } from "./page-client";

/**
 * Main page - server component
 * No auth required - users can use the PDF tool without logging in.
 * Login is only needed for the Pro subscription (unlimited files and pages).
 */
export default function Page(): React.JSX.Element {
  return <PageClient />;
}

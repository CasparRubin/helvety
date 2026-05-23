import { urls } from "@helvety/shared/config";
import { AppNotFound } from "@helvety/ui/app-not-found";

/** Docs zone 404 page. */
export default function NotFound(): React.JSX.Element {
  return <AppNotFound homeHref={urls.docs} />;
}

import { urls } from "@helvety/shared/config";
import { AppNotFound } from "@helvety/ui/app-not-found";

/** Root 404 page for the PDF app. */
export default function NotFound() {
  return <AppNotFound homeHref={urls.home} />;
}

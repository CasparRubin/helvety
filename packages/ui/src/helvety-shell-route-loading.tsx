import { LoadingSpinner } from "./loading-spinner";

/**
 * Root loading UI for public Helvety shells: full-viewport `bg-background` so in-zone
 * client navigations do not flash the browser default behind the shell (cross-zone
 * loads rely on `<head>` theme init in `HelvetyPublicShellRootLayout`).
 */
export function HelvetyShellRouteLoading() {
  return (
    <div className="bg-background flex min-h-svh w-full min-w-0 flex-1 flex-col">
      <LoadingSpinner />
    </div>
  );
}

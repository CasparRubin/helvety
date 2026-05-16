import { LoadingSpinner } from "./loading-spinner";

/**
 * Root loading UI for public Helvety shells: full-viewport themed backdrop so route
 * transitions do not flash the browser default white behind the shell (especially
 * on auth/store shells (Light Pillar on md+, static bg below md).
 */
export function HelvetyShellRouteLoading() {
  return (
    <div className="bg-background flex min-h-svh w-full min-w-0 flex-1 flex-col">
      <LoadingSpinner />
    </div>
  );
}

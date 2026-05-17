import { LoadingSpinner } from "./loading-spinner";

/**
 * Root loading UI for public Helvety shells: full-viewport themed backdrop so route
 * transitions do not flash the browser default canvas behind the shell (auth/store:
 * Light Pillar on md+ light or dark; static `bg-background` below md or with reduced motion).
 */
export function HelvetyShellRouteLoading() {
  return (
    <div className="bg-background flex min-h-svh w-full min-w-0 flex-1 flex-col">
      <LoadingSpinner />
    </div>
  );
}

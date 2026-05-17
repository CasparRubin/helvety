import { LoadingSpinner } from "./loading-spinner";

/**
 * Root loading UI for public Helvety shells: full-viewport themed backdrop so route
 * transitions do not flash the browser default white behind the shell (especially
 * on auth/store shells (Light Pillar on md+ dark; static bg in light mode, below md, or reduced motion).
 */
export function HelvetyShellRouteLoading() {
  return (
    <div className="bg-background flex min-h-svh w-full min-w-0 flex-1 flex-col">
      <LoadingSpinner />
    </div>
  );
}

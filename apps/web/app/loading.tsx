import { LoadingSpinner } from "@helvety/ui/loading-spinner";

/**
 * Root loading UI for the gateway: full-viewport themed backdrop so route transitions
 * (e.g. leaving the dark hero) do not flash the browser default white behind the shell.
 */
export default function Loading() {
  return (
    <div className="bg-background flex min-h-svh w-full min-w-0 flex-1 flex-col">
      <LoadingSpinner />
    </div>
  );
}

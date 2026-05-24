import { Loader2 } from "lucide-react";

/**
 * Centered spinner for root `app/loading.tsx` on tool and E2EE zones. Gateway,
 * auth, and store use {@link ./helvety-shell-route-loading} instead so the full
 * viewport stays on `bg-background` during transitions.
 */
export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

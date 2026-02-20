import { Loader2 } from "lucide-react";

/**
 * Shared loading spinner used as the root loading boundary across all apps.
 * Shown immediately during route transitions while the server component renders.
 */
export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

import { Loader2 } from "lucide-react";

/**
 * Root loading boundary for the Store app.
 * Shown immediately during route transitions while the server component renders,
 * providing instant visual feedback instead of a blank screen.
 */
export default function Loading() {
  return (
    <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

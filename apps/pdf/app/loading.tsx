import { Skeleton } from "@helvety/ui/skeleton";

/**
 * Root loading skeleton for the PDF app.
 * Matches the PDF tool layout with a dropzone and toolbar area.
 */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <Skeleton className="mx-auto h-7 w-40" />
          <Skeleton className="mx-auto mt-2 h-4 w-64" />
        </div>
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border-2 border-dashed">
          <div className="space-y-3 text-center">
            <Skeleton className="mx-auto h-12 w-12 rounded-lg" />
            <Skeleton className="mx-auto h-4 w-48" />
            <Skeleton className="mx-auto h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

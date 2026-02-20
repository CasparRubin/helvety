import { Skeleton } from "@helvety/ui/skeleton";

/**
 * Root loading skeleton for the tasks app.
 * Matches the task dashboard layout with a header and list of task rows.
 */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <Skeleton className="h-5 w-5 shrink-0 rounded" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

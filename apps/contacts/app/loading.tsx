import { Skeleton } from "@helvety/ui/skeleton";

/**
 * Root loading skeleton for the contacts app.
 * Matches the contact list layout with a header and contact rows.
 */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-4 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

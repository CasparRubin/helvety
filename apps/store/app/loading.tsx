import { Skeleton } from "@helvety/ui/skeleton";

/**
 * Root loading skeleton for the store app.
 * Matches the product catalog grid layout.
 */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border"
          >
            <Skeleton className="h-40 w-full" />
            <div className="flex flex-1 flex-col p-5">
              <Skeleton className="mb-2 h-5 w-3/4" />
              <Skeleton className="mb-1 h-4 w-20" />
              <div className="mt-3 flex-1 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

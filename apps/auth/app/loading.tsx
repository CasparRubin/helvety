import { Skeleton } from "@helvety/ui/skeleton";

/**
 * Root loading skeleton for the auth app.
 * Matches the centered card layout of the login page.
 */
export default function Loading() {
  return (
    <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-xl border p-6 shadow-sm">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

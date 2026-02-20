import { Skeleton } from "@helvety/ui/skeleton";

/** Loading UI for the spaces page (route transition). */
export default function SpacesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-2 h-5 w-40" />
      <Skeleton className="mb-6 h-8 w-24" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

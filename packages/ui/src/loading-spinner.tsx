/**
 * Centered spinner for root `app/loading.tsx` on tool zones. Gateway and
 * store use {@link ./helvety-shell-route-loading} instead so the full
 * viewport stays on `bg-background` during transitions.
 *
 * Must stay RSC-safe (no client components / lucide): `loading.tsx` under
 * CSP `strict-dynamic` cannot load an unnonced client chunk for the spinner.
 */
export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
      <div className="flex flex-col items-center gap-4">
        <div
          role="status"
          aria-label="Loading"
          className="border-muted-foreground/30 border-t-muted-foreground h-8 w-8 animate-spin rounded-full border-2"
        />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

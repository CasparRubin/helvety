import { Loader2 } from "lucide-react";

import { Button } from "./button";

/** Optional override for loading feedback text. */
interface ListLoadingStateProps {
  message?: string;
}

/** Error message with optional retry action. */
interface ListErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** Empty state heading and supporting description. */
interface ListEmptyStateProps {
  title: string;
  description: string;
}

/** Message shown when a search has no matches. */
interface ListEmptySearchStateProps {
  message: string;
}

/** Standard loading state used by list surfaces. */
export function ListLoadingState({
  message = "Loading...",
}: ListLoadingStateProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-5 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
}

/** Standard error state with an optional retry button. */
export function ListErrorState({
  message,
  onRetry,
}: ListErrorStateProps): React.JSX.Element {
  return (
    <div className="bg-muted/30 flex flex-col items-center justify-center gap-3 py-12">
      <p role="alert" className="text-muted-foreground text-sm">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

/** Standard empty state for lists without data. */
export function ListEmptyState({
  title,
  description,
}: ListEmptyStateProps): React.JSX.Element {
  return (
    <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground text-center text-sm">{description}</p>
    </div>
  );
}

/** Empty-search state for filtered lists with zero results. */
export function ListEmptySearchState({
  message,
}: ListEmptySearchStateProps): React.JSX.Element {
  return (
    <div className="text-muted-foreground flex justify-center py-12 text-center text-sm">
      {message}
    </div>
  );
}

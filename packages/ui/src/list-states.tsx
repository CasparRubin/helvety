import { Loader2 } from "lucide-react";

import { Button } from "./button";

/** Props for list loading feedback. */
interface ListLoadingStateProps {
  message?: string;
}

/** Props for list error feedback. */
interface ListErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** Props for list empty-state feedback. */
interface ListEmptyStateProps {
  title: string;
  description: string;
}

/** Props for empty-search feedback. */
interface ListEmptySearchStateProps {
  message: string;
}

/** Standard loading state for list surfaces. */
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

/** Standard error state for list surfaces. */
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

/** Standard empty state for list surfaces. */
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

/** Standard empty-search state for list surfaces. */
export function ListEmptySearchState({
  message,
}: ListEmptySearchStateProps): React.JSX.Element {
  return (
    <div className="text-muted-foreground flex justify-center py-12 text-center text-sm">
      {message}
    </div>
  );
}

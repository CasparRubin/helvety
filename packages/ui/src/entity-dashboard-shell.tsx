import type { ReactNode } from "react";

/** Props for the generic list-dashboard page shell. */
interface EntityDashboardShellProps {
  title: string;
  searchField: ReactNode;
  list: ReactNode;
}

/** Shared dashboard shell for title, search, and list regions. */
export function EntityDashboardShell({
  title,
  searchField,
  list,
}: EntityDashboardShellProps): React.JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
      {searchField}
      {list}
    </div>
  );
}

"use client";

/**
 * Task command bar - pinned toolbar below navbar (via CommandBarPageLayout).
 * Primary actions: create (and optional back when enabled)
 * Secondary actions (desktop inline, mobile dropdown): refresh, settings, edit, delete
 */

import {
  EntityCommandBar,
  type EntityCommandBarProps,
} from "@helvety/ui/entity-command-bar";

/** Props for the TaskCommandBar component. */
type TaskCommandBarProps = EntityCommandBarProps;

/**
 * Renders the task command bar with a primary create action,
 * optional back action, and secondary actions collapsed on mobile.
 */
export function TaskCommandBar({
  onBack,
  onCreateClick,
  createLabel,
  onRefresh,
  isRefreshing,
  onSettings,
  onEdit,
  editLabel,
  onDelete,
  deleteLabel,
  onExport,
  isExporting,
}: TaskCommandBarProps) {
  return (
    <EntityCommandBar
      onBack={onBack}
      onCreateClick={onCreateClick}
      createLabel={createLabel}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      onSettings={onSettings}
      onEdit={onEdit}
      editLabel={editLabel}
      onDelete={onDelete}
      deleteLabel={deleteLabel}
      onExport={onExport}
      isExporting={isExporting}
    />
  );
}

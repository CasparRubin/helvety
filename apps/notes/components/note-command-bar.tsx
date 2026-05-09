"use client";

/**
 * Note command bar - sticky toolbar below navbar
 * Primary actions: create (and optional back when enabled)
 * Secondary actions (desktop inline, mobile dropdown): refresh, settings, edit, delete
 */

import {
  EntityCommandBar,
  type EntityCommandBarProps,
} from "@helvety/ui/entity-command-bar";

/** Props for the NoteCommandBar component. */
type NoteCommandBarProps = EntityCommandBarProps;

/**
 * Renders the note command bar with a primary create action,
 * optional back action, and secondary actions collapsed on mobile.
 */
export function NoteCommandBar({
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
}: NoteCommandBarProps) {
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

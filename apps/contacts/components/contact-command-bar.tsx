"use client";

/**
 * Contact command bar - sticky toolbar below navbar for the contacts list page.
 * Primary actions (always visible): create
 * Secondary actions (desktop inline, mobile dropdown): refresh, settings
 */

import {
  EntityCommandBar,
  type EntityCommandBarProps,
} from "@helvety/ui/entity-command-bar";

/** Props for the ContactCommandBar component. */
type ContactCommandBarProps = Pick<
  EntityCommandBarProps,
  | "onCreateClick"
  | "onRefresh"
  | "isRefreshing"
  | "onSettings"
  | "onExport"
  | "isExporting"
>;

/**
 * Renders the contact command bar.
 */
export function ContactCommandBar({
  onCreateClick,
  onRefresh,
  isRefreshing,
  onSettings,
  onExport,
  isExporting,
}: ContactCommandBarProps) {
  return (
    <EntityCommandBar
      createLabel="New Contact"
      onCreateClick={onCreateClick}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      onSettings={onSettings}
      onExport={onExport}
      isExporting={isExporting}
    />
  );
}

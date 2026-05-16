"use client";

import {
  EntityCommandBar,
  type EntityCommandBarProps,
} from "@helvety/ui/entity-command-bar";
import { FolderPlusIcon } from "lucide-react";

/** Props for the links dashboard command bar. */
export type LinksCommandBarProps = Omit<
  EntityCommandBarProps,
  "secondaryCreateLabel" | "onSecondaryCreateClick" | "secondaryCreateIcon"
> & {
  onCreateFolderClick: () => void;
};

/**
 * Links list command bar: primary “New link”, secondary “New folder” (desktop inline, mobile menu).
 */
export function LinksCommandBar({
  onCreateFolderClick,
  ...props
}: LinksCommandBarProps): React.JSX.Element {
  return (
    <EntityCommandBar
      {...props}
      secondaryCreateLabel="New folder"
      onSecondaryCreateClick={onCreateFolderClick}
      secondaryCreateIcon={FolderPlusIcon}
    />
  );
}

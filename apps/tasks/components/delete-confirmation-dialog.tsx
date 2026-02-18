"use client";

import { DeleteConfirmationDialog as BaseDeleteConfirmationDialog } from "@helvety/ui/delete-confirmation-dialog";
import * as React from "react";

import {
  buildDeleteMessage,
  type EntityTypeId,
} from "@/lib/config/entity-config";

/** Props for DeleteConfirmationDialog */
export interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityTypeId;
  entityName?: string;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
}

/** Delete confirmation dialog with entity-specific messaging */
export function DeleteConfirmationDialog({
  entityType,
  entityName,
  ...props
}: DeleteConfirmationDialogProps): React.JSX.Element {
  const { title, description } = buildDeleteMessage(entityType, entityName);
  return (
    <BaseDeleteConfirmationDialog
      {...props}
      title={title}
      description={description}
    />
  );
}

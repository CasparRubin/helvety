"use client";

import { createEntityDeleteDialog } from "@helvety/ui/delete-confirmation-dialog";

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

export const DeleteConfirmationDialog =
  createEntityDeleteDialog<EntityTypeId>(buildDeleteMessage);

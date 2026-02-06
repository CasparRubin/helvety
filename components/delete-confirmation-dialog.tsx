"use client";

import { Loader2Icon } from "lucide-react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  buildDeleteMessage,
  type EntityTypeId,
} from "@/lib/config/entity-config";

/**
 * Props for DeleteConfirmationDialog
 */
export interface DeleteConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** The type of entity being deleted */
  entityType: EntityTypeId;
  /** Optional specific name of the entity being deleted */
  entityName?: string;
  /** Callback when deletion is confirmed */
  onConfirm: () => void | Promise<void>;
  /** Whether a delete operation is in progress */
  isDeleting?: boolean;
}

/**
 * Reusable delete confirmation dialog that dynamically generates
 * appropriate warning messages based on entity type
 *
 * Uses ENTITY_CONFIG to determine:
 * - Display name for the entity
 * - Whether the entity has children
 * - Examples of child content that will be deleted
 *
 * @example
 * ```tsx
 * <DeleteConfirmationDialog
 *   open={deleteDialogOpen}
 *   onOpenChange={setDeleteDialogOpen}
 *   entityType="unit"
 *   entityName="My Project"
 *   onConfirm={handleDelete}
 *   isDeleting={isDeleting}
 * />
 * ```
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  entityType,
  entityName,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationDialogProps): React.JSX.Element {
  const { title, description } = buildDeleteMessage(entityType, entityName);

  const handleConfirm = async (): Promise<void> => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

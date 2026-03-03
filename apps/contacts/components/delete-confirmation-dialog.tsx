"use client";

import { createEntityDeleteDialog } from "@helvety/ui/delete-confirmation-dialog";

import {
  buildDeleteMessage,
  type EntityTypeId,
} from "@/lib/config/entity-config";

export const DeleteConfirmationDialog =
  createEntityDeleteDialog<EntityTypeId>(buildDeleteMessage);

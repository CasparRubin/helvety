"use client";

import { cn } from "@helvety/shared/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@helvety/ui/alert-dialog";
import { Button } from "@helvety/ui/button";
import { EncryptionGateApp } from "@helvety/ui/encryption-gate-app";
import { ListEmptyState, ListLoadingState } from "@helvety/ui/list-states";
import { ScrollArea } from "@helvety/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@helvety/ui/sheet";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import type { DocListItem } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

/** Props for {@link VaultDocumentsSheet}. */
interface VaultDocumentsSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly initialUser: User;
  readonly activeDocId: string | null;
  readonly documents: DocListItem[];
  readonly isLoading: boolean;
  readonly vaultEnabled: boolean;
  readonly onOpenDocument: (id: string) => void;
  readonly onDeleteDocument: (id: string) => void;
}

/** Encrypted document list inside the vault sheet. */
function VaultDocumentList({
  documents,
  activeDocId,
  isLoading,
  onOpenDocument,
  onDeleteDocument,
}: {
  documents: DocListItem[];
  activeDocId: string | null;
  isLoading: boolean;
  onOpenDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
}): React.JSX.Element {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const deleteTargetTitle =
    documents.find((d) => d.id === deleteTargetId)?.title ?? "this document";

  if (isLoading) {
    return <ListLoadingState message="Loading documents…" />;
  }

  if (documents.length === 0) {
    return (
      <ListEmptyState
        title="No saved documents"
        description="Save from the toolbar when your vault is unlocked."
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-1 p-2">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center gap-1">
            <button
              type="button"
              className={cn(
                "hover:bg-accent min-w-0 flex-1 rounded-none px-3 py-2 text-left text-sm",
                activeDocId === doc.id && "bg-accent font-medium"
              )}
              onClick={() => onOpenDocument(doc.id)}
            >
              <span className="block truncate">{doc.title}</span>
              <span className="text-muted-foreground text-xs">
                {new Date(doc.updated_at).toLocaleString()}
              </span>
            </button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="shrink-0"
              aria-label={`Delete ${doc.title}`}
              onClick={() => setDeleteTargetId(doc.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &ldquo;{deleteTargetTitle}&rdquo; from your vault? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTargetId) {
                  onDeleteDocument(deleteTargetId);
                  setDeleteTargetId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Right sheet listing encrypted vault documents (sign-in required; list requires vault unlock). */
export function VaultDocumentsSheet({
  open,
  onOpenChange,
  initialUser,
  activeDocId,
  documents,
  isLoading,
  vaultEnabled,
  onOpenDocument,
  onDeleteDocument,
}: VaultDocumentsSheetProps): React.JSX.Element {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-border shrink-0 border-b px-4 py-3 text-left">
          <SheetTitle className="text-sm font-semibold">
            My documents
          </SheetTitle>
          <SheetDescription className="text-xs">
            Optional encrypted cloud save
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <EncryptionGateApp userId={initialUser.id}>
            <VaultDocumentList
              documents={vaultEnabled ? documents : []}
              activeDocId={activeDocId}
              isLoading={vaultEnabled && isLoading}
              onOpenDocument={onOpenDocument}
              onDeleteDocument={onDeleteDocument}
            />
          </EncryptionGateApp>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

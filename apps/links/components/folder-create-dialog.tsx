"use client";

import { Button } from "@helvety/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@helvety/ui/dialog";
import { Input } from "@helvety/ui/input";
import { NativeSelect } from "@helvety/ui/native-select";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { LinksFormField } from "@/components/link-form-fields";
import { ALL_FOLDER_ID, toStorageFolderId } from "@/lib/all-folder";

import type { LinkFolder } from "@/lib/types";

/** Props for the create-folder dialog. */
interface FolderCreateDialogProps {
  open: boolean;
  folders: LinkFolder[];
  defaultParentFolderId: string | null;
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { name: string; parent_folder_id: string | null }) => void;
}

/**
 * Create-folder dialog (matches other E2EE apps: create in a dialog, edit in a sheet).
 */
export function FolderCreateDialog({
  open,
  folders,
  defaultParentFolderId,
  isCreating,
  onOpenChange,
  onCreate,
}: FolderCreateDialogProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [parentFolderId, setParentFolderId] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setParentFolderId(defaultParentFolderId ?? ALL_FOLDER_ID);
    }
  }, [defaultParentFolderId, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || isCreating) {
      return;
    }
    onCreate({
      name: name.trim(),
      parent_folder_id: toStorageFolderId(parentFolderId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Folders can contain links and other folders. Folder names are
              encrypted on your device.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <LinksFormField label="Name" htmlFor="new-folder-name">
              <Input
                id="new-folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                autoFocus
                placeholder="e.g. Reading list"
                required
              />
            </LinksFormField>
            <LinksFormField label="Parent folder" htmlFor="new-folder-parent">
              <NativeSelect
                id="new-folder-parent"
                value={parentFolderId}
                onChange={(e) => setParentFolderId(e.target.value)}
              >
                <option value={ALL_FOLDER_ID}>All</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </NativeSelect>
            </LinksFormField>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isCreating}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create folder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

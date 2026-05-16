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
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { LinkFormFields } from "@/components/link-form-fields";
import { ALL_FOLDER_ID, toStorageFolderId } from "@/lib/all-folder";

import type { LinkFolder } from "@/lib/types";

/** Props for the create-link dialog. */
interface LinkCreateDialogProps {
  open: boolean;
  folders: LinkFolder[];
  defaultFolderId: string | null;
  parentFolderName: string | null;
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: {
    url: string;
    name: string;
    folder_id: string | null;
  }) => void;
}

/**
 * Create-link dialog (matches other E2EE apps: create in a dialog, edit in a sheet).
 */
export function LinkCreateDialog({
  open,
  folders,
  defaultFolderId,
  parentFolderName,
  isCreating,
  onOpenChange,
  onCreate,
}: LinkCreateDialogProps): React.JSX.Element {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState("");

  useEffect(() => {
    if (open) {
      setUrl("");
      setName("");
      setFolderId(defaultFolderId ?? ALL_FOLDER_ID);
    }
  }, [defaultFolderId, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!url.trim() || isCreating) {
      return;
    }
    onCreate({
      url: url.trim(),
      name: name.trim(),
      folder_id: toStorageFolderId(folderId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New link</DialogTitle>
            <DialogDescription>
              {parentFolderName
                ? `Add a bookmark inside “${parentFolderName}”.`
                : "Add a bookmark to your library. Name and URL are encrypted on your device."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <LinkFormFields
              url={url}
              name={name}
              folderId={folderId}
              folders={folders}
              onUrlChange={setUrl}
              onNameChange={setName}
              onFolderIdChange={setFolderId}
              urlInputId="new-link-url"
              nameInputId="new-link-name"
              folderSelectId="new-link-folder"
              autoFocusUrl
            />
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
            <Button type="submit" disabled={!url.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create link"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

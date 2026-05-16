"use client";

import { Button } from "@helvety/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@helvety/ui/sheet";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import {
  LINKS_SHEET_CONTENT_CLASS,
  LINKS_SHEET_FOOTER_ACTIONS_CLASS,
  LinkFormFields,
  LinksSheetBody,
} from "@/components/link-form-fields";

import type { LinkFolder } from "@/lib/types";

/**
 *
 */
interface LinkCreateSheetProps {
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
 *
 */
export function LinkCreateSheet({
  open,
  folders,
  defaultFolderId,
  parentFolderName,
  isCreating,
  onOpenChange,
  onCreate,
}: LinkCreateSheetProps): React.JSX.Element {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState("");

  useEffect(() => {
    if (open) {
      setUrl("");
      setName("");
      setFolderId(defaultFolderId ?? "");
    }
  }, [defaultFolderId, open]);

  const canCreate = url.trim().length > 0 && !isCreating;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={LINKS_SHEET_CONTENT_CLASS}>
        <SheetHeader className="shrink-0">
          <SheetTitle>New link</SheetTitle>
          {parentFolderName ? (
            <SheetDescription>Inside “{parentFolderName}”</SheetDescription>
          ) : null}
        </SheetHeader>
        <LinksSheetBody>
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
        </LinksSheetBody>
        <SheetFooter className={LINKS_SHEET_FOOTER_ACTIONS_CLASS}>
          <Button
            type="button"
            variant="outline"
            disabled={isCreating}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canCreate}
            onClick={() =>
              onCreate({
                url: url.trim(),
                name: name.trim(),
                folder_id: folderId ? folderId : null,
              })
            }
          >
            {isCreating ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : null}
            Create link
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

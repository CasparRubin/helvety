"use client";

import { Button } from "@helvety/ui/button";
import {
  Sheet,
  SheetContent,
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

import type { Link, LinkFolder } from "@/lib/types";

/**
 *
 */
interface LinkEditorSheetProps {
  open: boolean;
  link: Link | null;
  folders: LinkFolder[];
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    name: string;
    url: string;
    folder_id: string | null;
  }) => Promise<boolean>;
  onDelete?: () => void;
  isSaving: boolean;
  isDeleting?: boolean;
}

/**
 *
 */
export function LinkEditorSheet({
  open,
  link,
  folders,
  onOpenChange,
  onSave,
  onDelete,
  isSaving,
  isDeleting = false,
}: LinkEditorSheetProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [folderId, setFolderId] = useState("");

  useEffect(() => {
    if (link) {
      setName(link.name);
      setUrl(link.url);
      setFolderId(link.folder_id ?? "");
    }
  }, [link]);

  const canSave = url.trim().length > 0 && !isSaving && !isDeleting;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={LINKS_SHEET_CONTENT_CLASS}>
        <SheetHeader className="shrink-0">
          <SheetTitle>Link details</SheetTitle>
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
            autoFocusUrl
          />
        </LinksSheetBody>
        <SheetFooter className="gap-4">
          {onDelete ? (
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:mr-auto sm:w-auto"
              disabled={isSaving || isDeleting}
              onClick={onDelete}
            >
              {isDeleting ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : null}
              Delete link
            </Button>
          ) : null}
          <div className={LINKS_SHEET_FOOTER_ACTIONS_CLASS}>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving || isDeleting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canSave}
              onClick={() =>
                void onSave({
                  name: name.trim(),
                  url: url.trim(),
                  folder_id: folderId ? folderId : null,
                })
              }
            >
              {isSaving ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : null}
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

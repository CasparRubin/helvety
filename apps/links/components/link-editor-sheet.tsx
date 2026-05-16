"use client";

import { Button } from "@helvety/ui/button";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { NativeSelect } from "@helvety/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@helvety/ui/sheet";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

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
  isSaving: boolean;
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
  isSaving,
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle>Edit link</SheetTitle>
        </SheetHeader>
        <LinkEditorFields
          name={name}
          url={url}
          folderId={folderId}
          folders={folders}
          onNameChange={setName}
          onUrlChange={setUrl}
          onFolderIdChange={setFolderId}
        />
        <SheetFooter>
          <Button
            type="button"
            disabled={isSaving || !name.trim() || !url.trim()}
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 *
 */
function LinkEditorFields({
  name,
  url,
  folderId,
  folders,
  onNameChange,
  onUrlChange,
  onFolderIdChange,
}: {
  name: string;
  url: string;
  folderId: string;
  folders: LinkFolder[];
  onNameChange: (v: string) => void;
  onUrlChange: (v: string) => void;
  onFolderIdChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="link-name">Name</Label>
        <Input
          id="link-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-url">URL</Label>
        <Input
          id="link-url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          autoComplete="off"
          inputMode="url"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-folder">Folder</Label>
        <NativeSelect
          id="link-folder"
          value={folderId}
          onChange={(e) => onFolderIdChange(e.target.value)}
        >
          <option value="">Home</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

"use client";

import { cn } from "@helvety/shared/utils";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { NativeSelect } from "@helvety/ui/native-select";

import type { LinkFolder } from "@/lib/types";

/** Matches contacts/tasks/notes right-hand detail sheets. */
export const LINKS_SHEET_CONTENT_CLASS =
  "flex w-full flex-col overflow-hidden sm:max-w-[95vw] 2xl:max-w-[1800px]";

const LINKS_SHEET_BODY_CLASS = "min-h-0 flex-1 overflow-y-auto";

const LINKS_SHEET_FORM_CLASS =
  "container mx-auto flex flex-col gap-6 px-4 py-8";

const LINKS_FORM_FIELD_CLASS = "grid gap-2";

/** Primary/cancel actions; mirrors `DialogFooter` in @helvety/ui. */
export const LINKS_SHEET_FOOTER_ACTIONS_CLASS =
  "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end";

/**
 * Scrollable sheet body region with consistent page padding.
 */
export function LinksSheetBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={LINKS_SHEET_BODY_CLASS}>
      <div className={cn(LINKS_SHEET_FORM_CLASS, className)}>{children}</div>
    </div>
  );
}

/**
 * Single label + control group (`grid gap-2`).
 */
export function LinksFormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className={LINKS_FORM_FIELD_CLASS}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/**
 * URL, name, and folder fields shared by create/edit link sheets.
 */
export function LinkFormFields({
  url,
  name,
  folderId,
  folders,
  onUrlChange,
  onNameChange,
  onFolderIdChange,
  urlInputId = "link-url",
  nameInputId = "link-name",
  folderSelectId = "link-folder",
  autoFocusUrl = false,
}: {
  url: string;
  name: string;
  folderId: string;
  folders: LinkFolder[];
  onUrlChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onFolderIdChange: (value: string) => void;
  urlInputId?: string;
  nameInputId?: string;
  folderSelectId?: string;
  autoFocusUrl?: boolean;
}): React.JSX.Element {
  return (
    <>
      <LinksFormField label="URL" htmlFor={urlInputId}>
        <Input
          id={urlInputId}
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          autoComplete="off"
          inputMode="url"
          placeholder="https://example.com"
          autoFocus={autoFocusUrl}
        />
      </LinksFormField>
      <LinksFormField label="Name (optional)" htmlFor={nameInputId}>
        <Input
          id={nameInputId}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoComplete="off"
          placeholder="Defaults to the site name"
        />
      </LinksFormField>
      <LinksFormField label="Folder" htmlFor={folderSelectId}>
        <NativeSelect
          id={folderSelectId}
          value={folderId}
          onChange={(e) => onFolderIdChange(e.target.value)}
        >
          <option value="">Root</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </NativeSelect>
      </LinksFormField>
    </>
  );
}

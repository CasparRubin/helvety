"use client";

import {
  E2EE_EDITOR_FORM_FIELDS_STACK_CLASS,
  E2EE_FORM_FIELD_CLASS,
} from "@helvety/ui/e2ee-form-layout";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { NativeSelect } from "@helvety/ui/native-select";

import { ALL_FOLDER_ID, isAllFolderId } from "@/lib/all-folder";

import type { LinkFolder } from "@/lib/types";

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
    <div className={E2EE_FORM_FIELD_CLASS}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/** URL, name, and folder fields for the link detail sheet editor (folder select includes All). */
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
  fieldsStackClassName = E2EE_EDITOR_FORM_FIELDS_STACK_CLASS,
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
  /** Optional stack class override for form field groups. */
  fieldsStackClassName?: string;
}): React.JSX.Element {
  return (
    <div className={fieldsStackClassName}>
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
          <option value={ALL_FOLDER_ID}>All</option>
          {folders
            .filter((folder) => !isAllFolderId(folder.id))
            .map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
        </NativeSelect>
      </LinksFormField>
    </div>
  );
}

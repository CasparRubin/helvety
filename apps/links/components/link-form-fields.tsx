"use client";

import { E2EE_EDITOR_FORM_FIELDS_STACK_CLASS } from "@helvety/ui/e2ee-form-layout";
import { FormField } from "@helvety/ui/form-field";
import { Input } from "@helvety/ui/input";
import { NativeSelect } from "@helvety/ui/native-select";

import { ALL_FOLDER_ID, isAllFolderId } from "@/lib/all-folder";

import type { LinkFolder } from "@/lib/types";

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
      <FormField label="URL" id={urlInputId}>
        <Input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          autoComplete="off"
          inputMode="url"
          placeholder="https://example.com"
          autoFocus={autoFocusUrl}
        />
      </FormField>
      <FormField label="Name (optional)" id={nameInputId}>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoComplete="off"
          placeholder="Defaults to the site name"
        />
      </FormField>
      <FormField label="Folder" id={folderSelectId}>
        <NativeSelect
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
      </FormField>
    </div>
  );
}

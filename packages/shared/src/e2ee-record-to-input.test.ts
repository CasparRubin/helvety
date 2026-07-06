import { describe, expect, it } from "vitest";

import {
  contactToInput,
  linkFolderToInput,
  linkToInput,
  noteToInput,
  taskToInput,
} from "./e2ee-record-to-input";

import type {
  Contact,
  Link,
  LinkFolder,
  Note,
  Task,
} from "./e2ee-domain-types";

const baseTimestamps = {
  user_id: "user-1",
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
};

describe("e2ee-record-to-input", () => {
  it("taskToInput copies editable task fields", () => {
    const task: Task = {
      id: "task-1",
      ...baseTimestamps,
      title: "Ship",
      description: "Details",
      start_date: "2026-01-03",
      end_date: "2026-01-04",
      stage_id: "default-item-backlog",
      label_id: "default-item-label",
      priority: 2,
    };
    expect(taskToInput(task)).toEqual({
      title: "Ship",
      description: "Details",
      start_date: "2026-01-03",
      end_date: "2026-01-04",
      stage_id: "default-item-backlog",
      label_id: "default-item-label",
      priority: 2,
    });
  });

  it("noteToInput copies editable note fields", () => {
    const note: Note = {
      id: "note-1",
      ...baseTimestamps,
      title: "Ideas",
      description: "Milk",
      category_id: "personal",
    };
    expect(noteToInput(note)).toEqual({
      title: "Ideas",
      description: "Milk",
      category_id: "personal",
    });
  });

  it("contactToInput copies editable contact fields", () => {
    const contact: Contact = {
      id: "contact-1",
      ...baseTimestamps,
      first_name: "Ada",
      last_name: "Lovelace",
      description: "Mathematician",
      email: "ada@example.com",
      phone: "+41",
      birthday: "1815-12-10",
      notes: "Notes body",
      category_id: "work",
    };
    expect(contactToInput(contact)).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      description: "Mathematician",
      email: "ada@example.com",
      phone: "+41",
      birthday: "1815-12-10",
      notes: "Notes body",
      category_id: "work",
    });
  });

  it("linkToInput copies editable link fields", () => {
    const link: Link = {
      id: "link-1",
      ...baseTimestamps,
      name: "Helvety",
      url: "https://helvety.com",
      folder_id: "folder-1",
    };
    expect(linkToInput(link)).toEqual({
      name: "Helvety",
      url: "https://helvety.com",
      folder_id: "folder-1",
    });
  });

  it("linkFolderToInput copies editable folder fields", () => {
    const folder: LinkFolder = {
      id: "folder-1",
      ...baseTimestamps,
      name: "Reading",
      parent_folder_id: null,
    };
    expect(linkFolderToInput(folder)).toEqual({
      name: "Reading",
      parent_folder_id: null,
    });
  });
});

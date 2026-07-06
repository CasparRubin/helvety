import { describe, expect, it } from "vitest";

import { normalizeBookmarkUrl } from "../e2ee-url-normalize";

import {
  decryptContactLabel,
  decryptContactRow,
  decryptLinkFolderRow,
  decryptLinkRow,
  decryptNoteRow,
  decryptTaskRow,
  decryptTaskTitle,
  toLinkFolderPickerItem,
} from "./e2ee-entity-crypto-decrypt";
import {
  encryptContactCreate,
  encryptLinkCreate,
  encryptLinkFolderCreate,
  encryptNoteCreate,
  encryptTaskCreate,
  encryptTaskUpdate,
} from "./e2ee-entity-crypto-encrypt";
import {
  ENCRYPTION_VERSION,
  encryptEntityField,
  parseEncryptedData,
  serializeEncryptedData,
} from "./encryption";

const TASK_ID = "11111111-1111-4111-8111-111111111111";
const NOTE_ID = "22222222-2222-4222-8222-222222222222";
const CONTACT_ID = "33333333-3333-4333-8333-333333333333";
const FOLDER_ID = "55555555-5555-4555-8555-555555555555";

/**
 *
 */
async function aes256GcmKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

const LIST_META = {
  stage_id: "default-item-backlog",
  category_id: "personal",
  sort_order: 0,
  created_at: "2020-01-01T00:00:00.000Z",
  folder_id: null as string | null,
};

describe("e2ee-entity-crypto encrypt roundtrip", () => {
  it("contact create encrypts only ciphertext columns", async () => {
    const key = await aes256GcmKey();
    const payload = await encryptContactCreate(
      {
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com",
      },
      key
    );
    expect(payload.encrypted_first_name).toMatch(/^\{/);
    expect(payload.encrypted_last_name).toMatch(/^\{/);
    expect(payload.encrypted_email).toMatch(/^\{/);
    expect(payload).not.toHaveProperty("first_name");
    expect(payload).not.toHaveProperty("last_name");
  });

  it("contact create decrypts to same plaintext", async () => {
    const key = await aes256GcmKey();
    const payload = await encryptContactCreate(
      { first_name: "Grace", last_name: "Hopper", description: "Admiral" },
      key
    );
    const row = {
      id: payload.id,
      user_id: "user-1",
      encrypted_first_name: payload.encrypted_first_name,
      encrypted_last_name: payload.encrypted_last_name,
      encrypted_description: payload.encrypted_description,
      encrypted_email: null,
      encrypted_phone: null,
      encrypted_birthday: null,
      encrypted_notes: null,
      category_id: payload.category_id,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const contact = await decryptContactRow(row, key);
    expect(contact.first_name).toBe("Grace");
    expect(contact.last_name).toBe("Hopper");
    expect(contact.description).toBe("Admiral");
  });

  it("task create uses field-bound encryption", async () => {
    const key = await aes256GcmKey();
    const payload = await encryptTaskCreate({ title: "Ship feature" }, key);
    const parsed = parseEncryptedData(payload.encrypted_title);
    expect(parsed.version).toBe(ENCRYPTION_VERSION);
    const row = {
      id: payload.id,
      encrypted_title: payload.encrypted_title,
      stage_id: "default-item-backlog",
      sort_order: 0,
      created_at: new Date().toISOString(),
    };
    await expect(decryptTaskTitle(row, key)).resolves.toBe("Ship feature");
  });

  it("create helpers honor clientRecordId when supplied", async () => {
    const key = await aes256GcmKey();
    const clientId = "550e8400-e29b-41d4-a716-446655440000";
    const payload = await encryptTaskCreate(
      { title: "Draft task" },
      key,
      clientId
    );
    expect(payload.id).toBe(clientId);
  });

  it("encryptTaskUpdate patches only supplied encrypted fields", async () => {
    const key = await aes256GcmKey();
    const patch = await encryptTaskUpdate(
      TASK_ID,
      { title: "Updated title" },
      key
    );
    expect(patch.encrypted_title).toMatch(/^\{/);
    expect(patch).not.toHaveProperty("encrypted_description");
    expect(patch).not.toHaveProperty("stage_id");
  });

  it("note create roundtrips through decryptNoteRow", async () => {
    const key = await aes256GcmKey();
    const payload = await encryptNoteCreate(
      { title: "Ideas", description: "E2EE extension" },
      key
    );
    const note = await decryptNoteRow(
      {
        id: payload.id,
        user_id: "u",
        encrypted_title: payload.encrypted_title,
        encrypted_description: payload.encrypted_description,
        category_id: payload.category_id,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      key
    );
    expect(note.title).toBe("Ideas");
    expect(note.description).toBe("E2EE extension");
  });

  it("link create normalizes URL before encrypt", async () => {
    const key = await aes256GcmKey();
    const payload = await encryptLinkCreate(
      { name: "", url: "helvety.com/pdf" },
      key
    );
    const normalized = normalizeBookmarkUrl("helvety.com/pdf");
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) {
      return;
    }
    const link = await decryptLinkRow(
      {
        id: payload.id,
        user_id: "u",
        encrypted_name: payload.encrypted_name,
        encrypted_url: payload.encrypted_url,
        folder_id: payload.folder_id,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      key
    );
    expect(link.url).toBe(normalized.url);
  });

  it("link folder create roundtrips through decryptLinkFolderRow", async () => {
    const key = await aes256GcmKey();
    const payload = await encryptLinkFolderCreate(
      { name: "Work bookmarks", parent_folder_id: null },
      key
    );
    const folder = await decryptLinkFolderRow(
      {
        id: payload.id,
        user_id: "u",
        encrypted_name: payload.encrypted_name,
        parent_folder_id: payload.parent_folder_id,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      key
    );
    expect(folder.name).toBe("Work bookmarks");
    expect(folder.parent_folder_id).toBeNull();
  });
});

describe("e2ee-entity-crypto decrypt (client-side roundtrip)", () => {
  it("decryptTaskTitle reverses field-bound encrypt", async () => {
    const key = await aes256GcmKey();
    const plaintext = "Buy oat milk";
    const enc = await encryptEntityField(plaintext, key, {
      table: "items",
      recordId: TASK_ID,
      column: "encrypted_title",
    });
    const row = {
      id: TASK_ID,
      encrypted_title: serializeEncryptedData(enc),
      stage_id: LIST_META.stage_id,
      sort_order: LIST_META.sort_order,
      created_at: LIST_META.created_at,
    };
    await expect(decryptTaskTitle(row, key)).resolves.toBe(plaintext);
  });

  it("decryptContactLabel decrypts first and last", async () => {
    const key = await aes256GcmKey();
    const ctx = { table: "contacts", recordId: CONTACT_ID };
    const encFirst = await encryptEntityField("Ada", key, {
      ...ctx,
      column: "encrypted_first_name",
    });
    const encLast = await encryptEntityField("Lovelace", key, {
      ...ctx,
      column: "encrypted_last_name",
    });
    const row = {
      id: CONTACT_ID,
      encrypted_first_name: serializeEncryptedData(encFirst),
      encrypted_last_name: serializeEncryptedData(encLast),
      category_id: LIST_META.category_id,
      sort_order: LIST_META.sort_order,
      created_at: LIST_META.created_at,
    };
    await expect(decryptContactLabel(row, key)).resolves.toBe("Ada Lovelace");
  });

  it("decryptContactLabel trims when last name decrypts empty", async () => {
    const key = await aes256GcmKey();
    const ctx = { table: "contacts", recordId: CONTACT_ID };
    const encFirst = await encryptEntityField("Madonna", key, {
      ...ctx,
      column: "encrypted_first_name",
    });
    const encLast = await encryptEntityField("", key, {
      ...ctx,
      column: "encrypted_last_name",
    });
    const row = {
      id: CONTACT_ID,
      encrypted_first_name: serializeEncryptedData(encFirst),
      encrypted_last_name: serializeEncryptedData(encLast),
      category_id: LIST_META.category_id,
      sort_order: LIST_META.sort_order,
      created_at: LIST_META.created_at,
    };
    await expect(decryptContactLabel(row, key)).resolves.toBe("Madonna");
  });

  it("fails when ciphertext is decrypted with the wrong column context", async () => {
    const key = await aes256GcmKey();
    const enc = await encryptEntityField("555-0100", key, {
      table: "contacts",
      recordId: CONTACT_ID,
      column: "encrypted_phone",
    });
    const row = {
      id: CONTACT_ID,
      encrypted_first_name: serializeEncryptedData(enc),
      encrypted_last_name: serializeEncryptedData(
        await encryptEntityField("", key, {
          table: "contacts",
          recordId: CONTACT_ID,
          column: "encrypted_last_name",
        })
      ),
      category_id: LIST_META.category_id,
      sort_order: LIST_META.sort_order,
      created_at: LIST_META.created_at,
    };
    await expect(decryptContactLabel(row, key)).rejects.toThrow();
  });

  it("fails when ciphertext was sealed with a different field AAD", async () => {
    const key = await aes256GcmKey();
    const enc = await encryptEntityField("secret", key, {
      table: "notes",
      recordId: NOTE_ID,
      column: "encrypted_title",
    });
    const row = {
      id: NOTE_ID,
      encrypted_title: serializeEncryptedData(enc),
      stage_id: LIST_META.stage_id,
      sort_order: LIST_META.sort_order,
      created_at: LIST_META.created_at,
    };
    await expect(decryptTaskTitle(row, key)).rejects.toThrow();
  });

  it("fails when decrypting with the wrong key", async () => {
    const keyA = await aes256GcmKey();
    const keyB = await aes256GcmKey();
    const enc = await encryptEntityField("x", keyA, {
      table: "items",
      recordId: TASK_ID,
      column: "encrypted_title",
    });
    const row = {
      id: TASK_ID,
      encrypted_title: serializeEncryptedData(enc),
      stage_id: LIST_META.stage_id,
      sort_order: LIST_META.sort_order,
      created_at: LIST_META.created_at,
    };
    await expect(decryptTaskTitle(row, keyB)).rejects.toThrow();
  });
});

describe("e2ee-entity-crypto decrypt (detail rows)", () => {
  it("decryptTaskRow decrypts description and date fields", async () => {
    const key = await aes256GcmKey();
    const ctx = { table: "items", recordId: TASK_ID };
    const encTitle = await encryptEntityField("Ship release", key, {
      ...ctx,
      column: "encrypted_title",
    });
    const encDescription = await encryptEntityField("Final QA pass", key, {
      ...ctx,
      column: "encrypted_description",
    });
    const row = {
      id: TASK_ID,
      user_id: "user-1",
      encrypted_title: serializeEncryptedData(encTitle),
      encrypted_description: serializeEncryptedData(encDescription),
      encrypted_start_date: null,
      encrypted_end_date: null,
      stage_id: LIST_META.stage_id,
      label_id: "default-item-label",
      priority: 0,
      sort_order: LIST_META.sort_order,
      created_at: LIST_META.created_at,
      updated_at: LIST_META.created_at,
    };
    const task = await decryptTaskRow(row, key);
    expect(task.title).toBe("Ship release");
    expect(task.description).toBe("Final QA pass");
  });

  it("decryptContactRow decrypts email and phone detail fields", async () => {
    const key = await aes256GcmKey();
    const ctx = { table: "contacts", recordId: CONTACT_ID };
    const encFirst = await encryptEntityField("Grace", key, {
      ...ctx,
      column: "encrypted_first_name",
    });
    const encLast = await encryptEntityField("Hopper", key, {
      ...ctx,
      column: "encrypted_last_name",
    });
    const encEmail = await encryptEntityField("grace@example.com", key, {
      ...ctx,
      column: "encrypted_email",
    });
    const encPhone = await encryptEntityField("555-0100", key, {
      ...ctx,
      column: "encrypted_phone",
    });
    const row = {
      id: CONTACT_ID,
      user_id: "user-1",
      encrypted_first_name: serializeEncryptedData(encFirst),
      encrypted_last_name: serializeEncryptedData(encLast),
      encrypted_description: null,
      encrypted_email: serializeEncryptedData(encEmail),
      encrypted_phone: serializeEncryptedData(encPhone),
      encrypted_birthday: null,
      encrypted_notes: null,
      category_id: LIST_META.category_id,
      sort_order: LIST_META.sort_order,
      created_at: LIST_META.created_at,
      updated_at: LIST_META.created_at,
    };
    const contact = await decryptContactRow(row, key);
    expect(contact.first_name).toBe("Grace");
    expect(contact.email).toBe("grace@example.com");
    expect(contact.phone).toBe("555-0100");
  });

  it("decryptNoteRow decrypts description", async () => {
    const key = await aes256GcmKey();
    const ctx = { table: "notes", recordId: NOTE_ID };
    const encTitle = await encryptEntityField("Ideas", key, {
      ...ctx,
      column: "encrypted_title",
    });
    const encDescription = await encryptEntityField("Buy milk", key, {
      ...ctx,
      column: "encrypted_description",
    });
    const row = {
      id: NOTE_ID,
      user_id: "user-1",
      encrypted_title: serializeEncryptedData(encTitle),
      encrypted_description: serializeEncryptedData(encDescription),
      category_id: LIST_META.category_id,
      sort_order: LIST_META.sort_order,
      created_at: LIST_META.created_at,
      updated_at: LIST_META.created_at,
    };
    const note = await decryptNoteRow(row, key);
    expect(note.title).toBe("Ideas");
    expect(note.description).toBe("Buy milk");
  });

  it("decryptLinkFolderRow decrypts folder name with link_folders AAD", async () => {
    const key = await aes256GcmKey();
    const enc = await encryptEntityField("Reading list", key, {
      table: "link_folders",
      recordId: FOLDER_ID,
      column: "encrypted_name",
    });
    const row = {
      id: FOLDER_ID,
      user_id: "user-1",
      encrypted_name: serializeEncryptedData(enc),
      parent_folder_id: null,
      sort_order: 0,
      created_at: LIST_META.created_at,
      updated_at: LIST_META.created_at,
    };
    const folder = await decryptLinkFolderRow(row, key);
    expect(folder.name).toBe("Reading list");
  });

  it("toLinkFolderPickerItem maps decrypted folder name for picker rows", async () => {
    const key = await aes256GcmKey();
    const enc = await encryptEntityField("Archive", key, {
      table: "link_folders",
      recordId: FOLDER_ID,
      column: "encrypted_name",
    });
    const row = {
      id: FOLDER_ID,
      encrypted_name: serializeEncryptedData(enc),
      parent_folder_id: null,
      sort_order: 1,
      created_at: LIST_META.created_at,
    };
    const item = await toLinkFolderPickerItem(row, key);
    expect(item.title).toBe("Archive");
    expect(item.id).toBe(FOLDER_ID);
  });
});

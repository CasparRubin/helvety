/**
 * Task Encryption Helpers
 * Convenience functions for encrypting/decrypting Units, Spaces, Items,
 * StageConfigs, Stages, LabelConfigs, Labels, Attachments, and Contacts
 * client-side.
 *
 * The server only ever sees encrypted data.
 *
 * Note: Contact decryption is read-only - contacts are created and edited
 * in the Contacts app. Name, description, email, phone, and birthday are
 * decrypted here; notes content is not decrypted, only a `has_notes` flag
 * is derived.
 */

import {
  encrypt,
  decrypt,
  serializeEncryptedData,
  parseEncryptedData,
  buildAAD,
} from "./encryption";

import type {
  Unit,
  UnitRow,
  UnitInput,
  Space,
  SpaceRow,
  SpaceInput,
  Item,
  ItemRow,
  ItemInput,
  StageConfig,
  StageConfigRow,
  StageConfigInput,
  Stage,
  StageRow,
  StageInput,
  LabelConfig,
  LabelConfigRow,
  LabelConfigInput,
  Label,
  LabelRow,
  LabelInput,
  Attachment,
  AttachmentRow,
  AttachmentMetadata,
  Contact,
  ContactRow,
} from "@/lib/types";

// =============================================================================
// UNIT ENCRYPTION
// =============================================================================

/**
 * Encrypt a Unit for database storage
 * Takes plaintext input and returns encrypted fields ready for the server.
 * Generates a client-side UUID and binds all ciphertext to it via AAD.
 */
export async function encryptUnitInput(
  input: UnitInput,
  key: CryptoKey
): Promise<{
  id: string;
  encrypted_title: string;
  encrypted_description: string | null;
  stage_id?: string | null;
}> {
  const id = crypto.randomUUID();
  const aad = buildAAD("units", id);
  const encryptedTitle = await encrypt(input.title, key, aad);

  let encryptedDescription: string | null = null;
  if (input.description) {
    const encrypted = await encrypt(input.description, key, aad);
    encryptedDescription = serializeEncryptedData(encrypted);
  }

  return {
    id,
    encrypted_title: serializeEncryptedData(encryptedTitle),
    encrypted_description: encryptedDescription,
    stage_id: input.stage_id,
  };
}

/**
 * Decrypt a Unit row from the database
 * Takes encrypted database row and returns plaintext Unit
 */
export async function decryptUnitRow(
  row: UnitRow,
  key: CryptoKey
): Promise<Unit> {
  const aad = buildAAD("units", row.id);
  const title = await decrypt(
    parseEncryptedData(row.encrypted_title),
    key,
    aad
  );

  let description: string | null = null;
  if (row.encrypted_description) {
    description = await decrypt(
      parseEncryptedData(row.encrypted_description),
      key,
      aad
    );
  }

  return {
    id: row.id,
    user_id: row.user_id,
    title,
    description,
    stage_id: row.stage_id,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Decrypt multiple Unit rows
 */
export async function decryptUnitRows(
  rows: UnitRow[],
  key: CryptoKey
): Promise<Unit[]> {
  return Promise.all(rows.map((row) => decryptUnitRow(row, key)));
}

// =============================================================================
// SPACE ENCRYPTION
// =============================================================================

/**
 * Encrypt a Space for database storage
 */
export async function encryptSpaceInput(
  input: SpaceInput,
  key: CryptoKey
): Promise<{
  id: string;
  unit_id: string;
  encrypted_title: string;
  encrypted_description: string | null;
  stage_id?: string | null;
}> {
  const id = crypto.randomUUID();
  const aad = buildAAD("spaces", id);
  const encryptedTitle = await encrypt(input.title, key, aad);

  let encryptedDescription: string | null = null;
  if (input.description) {
    const encrypted = await encrypt(input.description, key, aad);
    encryptedDescription = serializeEncryptedData(encrypted);
  }

  return {
    id,
    unit_id: input.unit_id,
    encrypted_title: serializeEncryptedData(encryptedTitle),
    encrypted_description: encryptedDescription,
    stage_id: input.stage_id,
  };
}

/**
 * Decrypt a Space row from the database
 */
export async function decryptSpaceRow(
  row: SpaceRow,
  key: CryptoKey
): Promise<Space> {
  const aad = buildAAD("spaces", row.id);
  const title = await decrypt(
    parseEncryptedData(row.encrypted_title),
    key,
    aad
  );

  let description: string | null = null;
  if (row.encrypted_description) {
    description = await decrypt(
      parseEncryptedData(row.encrypted_description),
      key,
      aad
    );
  }

  return {
    id: row.id,
    unit_id: row.unit_id,
    user_id: row.user_id,
    title,
    description,
    stage_id: row.stage_id,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Decrypt multiple Space rows
 */
export async function decryptSpaceRows(
  rows: SpaceRow[],
  key: CryptoKey
): Promise<Space[]> {
  return Promise.all(rows.map((row) => decryptSpaceRow(row, key)));
}

// =============================================================================
// ITEM ENCRYPTION
// =============================================================================

/**
 * Encrypt an Item for database storage
 */
export async function encryptItemInput(
  input: ItemInput,
  key: CryptoKey
): Promise<{
  id: string;
  space_id: string;
  encrypted_title: string;
  encrypted_description: string | null;
  encrypted_start_date: string | null;
  encrypted_end_date: string | null;
  stage_id?: string | null;
  label_id?: string | null;
}> {
  const id = crypto.randomUUID();
  const aad = buildAAD("items", id);
  const encryptedTitle = await encrypt(input.title, key, aad);

  let encryptedDescription: string | null = null;
  if (input.description) {
    const encrypted = await encrypt(input.description, key, aad);
    encryptedDescription = serializeEncryptedData(encrypted);
  }

  let encryptedStartDate: string | null = null;
  if (input.start_date) {
    const encrypted = await encrypt(input.start_date, key, aad);
    encryptedStartDate = serializeEncryptedData(encrypted);
  }

  let encryptedEndDate: string | null = null;
  if (input.end_date) {
    const encrypted = await encrypt(input.end_date, key, aad);
    encryptedEndDate = serializeEncryptedData(encrypted);
  }

  return {
    id,
    space_id: input.space_id,
    encrypted_title: serializeEncryptedData(encryptedTitle),
    encrypted_description: encryptedDescription,
    encrypted_start_date: encryptedStartDate,
    encrypted_end_date: encryptedEndDate,
    stage_id: input.stage_id,
    label_id: input.label_id,
  };
}

/**
 * Decrypt an Item row from the database
 */
export async function decryptItemRow(
  row: ItemRow,
  key: CryptoKey
): Promise<Item> {
  const aad = buildAAD("items", row.id);
  const title = await decrypt(
    parseEncryptedData(row.encrypted_title),
    key,
    aad
  );

  let description: string | null = null;
  if (row.encrypted_description) {
    description = await decrypt(
      parseEncryptedData(row.encrypted_description),
      key,
      aad
    );
  }

  let start_date: string | null = null;
  if (row.encrypted_start_date) {
    start_date = await decrypt(
      parseEncryptedData(row.encrypted_start_date),
      key,
      aad
    );
  }

  let end_date: string | null = null;
  if (row.encrypted_end_date) {
    end_date = await decrypt(
      parseEncryptedData(row.encrypted_end_date),
      key,
      aad
    );
  }

  return {
    id: row.id,
    space_id: row.space_id,
    user_id: row.user_id,
    title,
    description,
    start_date,
    end_date,
    stage_id: row.stage_id,
    label_id: row.label_id,
    priority: row.priority,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Decrypt multiple Item rows
 */
export async function decryptItemRows(
  rows: ItemRow[],
  key: CryptoKey
): Promise<Item[]> {
  return Promise.all(rows.map((row) => decryptItemRow(row, key)));
}

// =============================================================================
// STAGE CONFIG ENCRYPTION
// =============================================================================

/**
 * Encrypt a StageConfig for database storage
 */
export async function encryptStageConfigInput(
  input: StageConfigInput,
  key: CryptoKey
): Promise<{ id: string; encrypted_name: string }> {
  const id = crypto.randomUUID();
  const aad = buildAAD("stage_configs", id);
  const encryptedName = await encrypt(input.name, key, aad);
  return {
    id,
    encrypted_name: serializeEncryptedData(encryptedName),
  };
}

/**
 * Decrypt a StageConfig row from the database
 */
export async function decryptStageConfigRow(
  row: StageConfigRow,
  key: CryptoKey
): Promise<StageConfig> {
  const aad = buildAAD("stage_configs", row.id);
  const name = await decrypt(parseEncryptedData(row.encrypted_name), key, aad);

  return {
    id: row.id,
    user_id: row.user_id,
    name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Decrypt multiple StageConfig rows
 */
export async function decryptStageConfigRows(
  rows: StageConfigRow[],
  key: CryptoKey
): Promise<StageConfig[]> {
  return Promise.all(rows.map((row) => decryptStageConfigRow(row, key)));
}

/**
 * Encrypt fields for updating a StageConfig
 */
export async function encryptStageConfigUpdate(
  id: string,
  update: Partial<StageConfigInput>,
  key: CryptoKey
): Promise<{ encrypted_name?: string }> {
  const aad = buildAAD("stage_configs", id);
  const result: { encrypted_name?: string } = {};

  if (update.name !== undefined) {
    const encrypted = await encrypt(update.name, key, aad);
    result.encrypted_name = serializeEncryptedData(encrypted);
  }

  return result;
}

// =============================================================================
// STAGE ENCRYPTION
// =============================================================================

/**
 * Encrypt a Stage for database storage
 */
export async function encryptStageInput(
  input: StageInput,
  key: CryptoKey
): Promise<{
  id: string;
  config_id: string;
  encrypted_name: string;
  color: string | null;
  icon: string;
  sort_order: number;
  default_rows_shown: number;
}> {
  const id = crypto.randomUUID();
  const aad = buildAAD("stages", id);
  const encryptedName = await encrypt(input.name, key, aad);

  return {
    id,
    config_id: input.config_id,
    encrypted_name: serializeEncryptedData(encryptedName),
    color: input.color ?? null,
    icon: input.icon ?? "circle",
    sort_order: input.sort_order ?? 0,
    default_rows_shown: input.default_rows_shown ?? 20,
  };
}

/**
 * Decrypt a Stage row from the database
 */
export async function decryptStageRow(
  row: StageRow,
  key: CryptoKey
): Promise<Stage> {
  const aad = buildAAD("stages", row.id);
  const name = await decrypt(parseEncryptedData(row.encrypted_name), key, aad);

  return {
    id: row.id,
    config_id: row.config_id,
    user_id: row.user_id,
    name,
    color: row.color,
    icon: row.icon,
    sort_order: row.sort_order,
    default_rows_shown: row.default_rows_shown,
    created_at: row.created_at,
  };
}

/**
 * Decrypt multiple Stage rows
 */
export async function decryptStageRows(
  rows: StageRow[],
  key: CryptoKey
): Promise<Stage[]> {
  return Promise.all(rows.map((row) => decryptStageRow(row, key)));
}

/**
 * Encrypt fields for updating a Stage
 */
export async function encryptStageUpdate(
  id: string,
  update: Partial<Omit<StageInput, "config_id">>,
  key: CryptoKey
): Promise<{
  encrypted_name?: string;
  color?: string | null;
  icon?: string;
  sort_order?: number;
  default_rows_shown?: number;
}> {
  const aad = buildAAD("stages", id);
  const result: {
    encrypted_name?: string;
    color?: string | null;
    icon?: string;
    sort_order?: number;
    default_rows_shown?: number;
  } = {};

  if (update.name !== undefined) {
    const encrypted = await encrypt(update.name, key, aad);
    result.encrypted_name = serializeEncryptedData(encrypted);
  }

  if (update.color !== undefined) {
    result.color = update.color;
  }

  if (update.icon !== undefined) {
    result.icon = update.icon;
  }

  if (update.sort_order !== undefined) {
    result.sort_order = update.sort_order;
  }

  if (update.default_rows_shown !== undefined) {
    result.default_rows_shown = update.default_rows_shown;
  }

  return result;
}

// =============================================================================
// LABEL CONFIG ENCRYPTION
// =============================================================================

/**
 * Encrypt a LabelConfig for database storage
 */
export async function encryptLabelConfigInput(
  input: LabelConfigInput,
  key: CryptoKey
): Promise<{ id: string; encrypted_name: string }> {
  const id = crypto.randomUUID();
  const aad = buildAAD("label_configs", id);
  const encryptedName = await encrypt(input.name, key, aad);
  return {
    id,
    encrypted_name: serializeEncryptedData(encryptedName),
  };
}

/**
 * Decrypt a LabelConfig row from the database
 */
export async function decryptLabelConfigRow(
  row: LabelConfigRow,
  key: CryptoKey
): Promise<LabelConfig> {
  const aad = buildAAD("label_configs", row.id);
  const name = await decrypt(parseEncryptedData(row.encrypted_name), key, aad);

  return {
    id: row.id,
    user_id: row.user_id,
    name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Decrypt multiple LabelConfig rows
 */
export async function decryptLabelConfigRows(
  rows: LabelConfigRow[],
  key: CryptoKey
): Promise<LabelConfig[]> {
  return Promise.all(rows.map((row) => decryptLabelConfigRow(row, key)));
}

/**
 * Encrypt fields for updating a LabelConfig
 */
export async function encryptLabelConfigUpdate(
  id: string,
  update: Partial<LabelConfigInput>,
  key: CryptoKey
): Promise<{ encrypted_name?: string }> {
  const aad = buildAAD("label_configs", id);
  const result: { encrypted_name?: string } = {};

  if (update.name !== undefined) {
    const encrypted = await encrypt(update.name, key, aad);
    result.encrypted_name = serializeEncryptedData(encrypted);
  }

  return result;
}

// =============================================================================
// LABEL ENCRYPTION
// =============================================================================

/**
 * Encrypt a Label for database storage
 */
export async function encryptLabelInput(
  input: LabelInput,
  key: CryptoKey
): Promise<{
  id: string;
  config_id: string;
  encrypted_name: string;
  color: string | null;
  icon: string;
  sort_order: number;
}> {
  const id = crypto.randomUUID();
  const aad = buildAAD("labels", id);
  const encryptedName = await encrypt(input.name, key, aad);

  return {
    id,
    config_id: input.config_id,
    encrypted_name: serializeEncryptedData(encryptedName),
    color: input.color ?? null,
    icon: input.icon ?? "circle",
    sort_order: input.sort_order ?? 0,
  };
}

/**
 * Decrypt a Label row from the database
 */
export async function decryptLabelRow(
  row: LabelRow,
  key: CryptoKey
): Promise<Label> {
  const aad = buildAAD("labels", row.id);
  const name = await decrypt(parseEncryptedData(row.encrypted_name), key, aad);

  return {
    id: row.id,
    config_id: row.config_id,
    user_id: row.user_id,
    name,
    color: row.color,
    icon: row.icon,
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

/**
 * Decrypt multiple Label rows
 */
export async function decryptLabelRows(
  rows: LabelRow[],
  key: CryptoKey
): Promise<Label[]> {
  return Promise.all(rows.map((row) => decryptLabelRow(row, key)));
}

/**
 * Encrypt fields for updating a Label
 */
export async function encryptLabelUpdate(
  id: string,
  update: Partial<Omit<LabelInput, "config_id">>,
  key: CryptoKey
): Promise<{
  encrypted_name?: string;
  color?: string | null;
  icon?: string;
  sort_order?: number;
}> {
  const aad = buildAAD("labels", id);
  const result: {
    encrypted_name?: string;
    color?: string | null;
    icon?: string;
    sort_order?: number;
  } = {};

  if (update.name !== undefined) {
    const encrypted = await encrypt(update.name, key, aad);
    result.encrypted_name = serializeEncryptedData(encrypted);
  }

  if (update.color !== undefined) {
    result.color = update.color;
  }

  if (update.icon !== undefined) {
    result.icon = update.icon;
  }

  if (update.sort_order !== undefined) {
    result.sort_order = update.sort_order;
  }

  return result;
}

// =============================================================================
// UPDATE HELPERS
// =============================================================================

/**
 * Encrypt fields for updating a Unit
 * Only encrypts provided fields (for partial updates)
 */
export async function encryptUnitUpdate(
  id: string,
  update: Partial<UnitInput>,
  key: CryptoKey
): Promise<{
  encrypted_title?: string;
  encrypted_description?: string | null;
}> {
  const aad = buildAAD("units", id);
  const result: {
    encrypted_title?: string;
    encrypted_description?: string | null;
  } = {};

  if (update.title !== undefined) {
    const encrypted = await encrypt(update.title, key, aad);
    result.encrypted_title = serializeEncryptedData(encrypted);
  }

  if (update.description !== undefined) {
    if (update.description === null) {
      result.encrypted_description = null;
    } else {
      const encrypted = await encrypt(update.description, key, aad);
      result.encrypted_description = serializeEncryptedData(encrypted);
    }
  }

  return result;
}

/**
 * Encrypt fields for updating a Space
 */
export async function encryptSpaceUpdate(
  id: string,
  update: Partial<Omit<SpaceInput, "unit_id">>,
  key: CryptoKey
): Promise<{
  encrypted_title?: string;
  encrypted_description?: string | null;
}> {
  const aad = buildAAD("spaces", id);
  const result: {
    encrypted_title?: string;
    encrypted_description?: string | null;
  } = {};

  if (update.title !== undefined) {
    const encrypted = await encrypt(update.title, key, aad);
    result.encrypted_title = serializeEncryptedData(encrypted);
  }

  if (update.description !== undefined) {
    if (update.description === null) {
      result.encrypted_description = null;
    } else {
      const encrypted = await encrypt(update.description, key, aad);
      result.encrypted_description = serializeEncryptedData(encrypted);
    }
  }

  return result;
}

/**
 * Encrypt fields for updating an Item
 */
export async function encryptItemUpdate(
  id: string,
  update: Partial<Omit<ItemInput, "space_id">>,
  key: CryptoKey
): Promise<{
  encrypted_title?: string;
  encrypted_description?: string | null;
  encrypted_start_date?: string | null;
  encrypted_end_date?: string | null;
}> {
  const aad = buildAAD("items", id);
  const result: {
    encrypted_title?: string;
    encrypted_description?: string | null;
    encrypted_start_date?: string | null;
    encrypted_end_date?: string | null;
  } = {};

  if (update.title !== undefined) {
    const encrypted = await encrypt(update.title, key, aad);
    result.encrypted_title = serializeEncryptedData(encrypted);
  }

  if (update.description !== undefined) {
    if (update.description === null) {
      result.encrypted_description = null;
    } else {
      const encrypted = await encrypt(update.description, key, aad);
      result.encrypted_description = serializeEncryptedData(encrypted);
    }
  }

  if (update.start_date !== undefined) {
    if (update.start_date === null) {
      result.encrypted_start_date = null;
    } else {
      const encrypted = await encrypt(update.start_date, key, aad);
      result.encrypted_start_date = serializeEncryptedData(encrypted);
    }
  }

  if (update.end_date !== undefined) {
    if (update.end_date === null) {
      result.encrypted_end_date = null;
    } else {
      const encrypted = await encrypt(update.end_date, key, aad);
      result.encrypted_end_date = serializeEncryptedData(encrypted);
    }
  }

  return result;
}

// =============================================================================
// ATTACHMENT ENCRYPTION
// =============================================================================

/**
 * Encrypt attachment metadata for database storage.
 * The metadata (filename, MIME type, size) is encrypted as a JSON string
 * using the same pattern as other encrypted fields.
 * Generates a client-side UUID and returns it alongside the encrypted metadata.
 */
export async function encryptAttachmentMetadata(
  metadata: AttachmentMetadata,
  key: CryptoKey
): Promise<{ id: string; encrypted_metadata: string }> {
  const id = crypto.randomUUID();
  const aad = buildAAD("item_attachments", id);
  const json = JSON.stringify(metadata);
  const encrypted = await encrypt(json, key, aad);
  return { id, encrypted_metadata: serializeEncryptedData(encrypted) };
}

/**
 * Decrypt an Attachment row from the database.
 * Decrypts the encrypted_metadata field and returns a client-side Attachment.
 */
export async function decryptAttachmentRow(
  row: AttachmentRow,
  key: CryptoKey
): Promise<Attachment> {
  const aad = buildAAD("item_attachments", row.id);
  const metadataJson = await decrypt(
    parseEncryptedData(row.encrypted_metadata),
    key,
    aad
  );
  const metadata: AttachmentMetadata = JSON.parse(metadataJson);

  return {
    id: row.id,
    item_id: row.item_id,
    user_id: row.user_id,
    storage_path: row.storage_path,
    metadata,
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

/**
 * Decrypt multiple Attachment rows
 */
export async function decryptAttachmentRows(
  rows: AttachmentRow[],
  key: CryptoKey
): Promise<Attachment[]> {
  return Promise.all(rows.map((row) => decryptAttachmentRow(row, key)));
}

// =============================================================================
// CONTACT DECRYPTION (read-only, contacts are created/edited in the Contacts app)
// =============================================================================

/**
 * Decrypt a Contact row from the database.
 * Decrypts first_name, last_name, description, email, phone, and birthday.
 * Notes content is NOT decrypted; only a `has_notes` boolean flag is derived
 * from whether encrypted_notes is non-null.
 */
export async function decryptContactRow(
  row: ContactRow,
  key: CryptoKey
): Promise<Contact> {
  const aad = buildAAD("contacts", row.id);
  const firstName = await decrypt(
    parseEncryptedData(row.encrypted_first_name),
    key,
    aad
  );
  const lastName = await decrypt(
    parseEncryptedData(row.encrypted_last_name),
    key,
    aad
  );

  let description: string | null = null;
  if (row.encrypted_description) {
    description = await decrypt(
      parseEncryptedData(row.encrypted_description),
      key,
      aad
    );
  }

  let email: string | null = null;
  if (row.encrypted_email) {
    email = await decrypt(parseEncryptedData(row.encrypted_email), key, aad);
  }

  let phone: string | null = null;
  if (row.encrypted_phone) {
    phone = await decrypt(parseEncryptedData(row.encrypted_phone), key, aad);
  }

  let birthday: string | null = null;
  if (row.encrypted_birthday) {
    birthday = await decrypt(
      parseEncryptedData(row.encrypted_birthday),
      key,
      aad
    );
  }

  return {
    id: row.id,
    user_id: row.user_id,
    first_name: firstName,
    last_name: lastName,
    description,
    email,
    phone,
    birthday,
    has_notes: row.encrypted_notes !== null,
    category_id: row.category_id,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Decrypt multiple Contact rows
 */
export async function decryptContactRows(
  rows: ContactRow[],
  key: CryptoKey
): Promise<Contact[]> {
  return Promise.all(rows.map((row) => decryptContactRow(row, key)));
}

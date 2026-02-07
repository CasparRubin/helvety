/**
 * Task Encryption Helpers
 * Convenience functions for encrypting/decrypting Units, Spaces, Items,
 * StageConfigs, and Stages client-side.
 *
 * The server only ever sees encrypted data.
 */

import {
  encrypt,
  decrypt,
  serializeEncryptedData,
  parseEncryptedData,
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
} from "@/lib/types";

// =============================================================================
// UNIT ENCRYPTION
// =============================================================================

/**
 * Encrypt a Unit for database storage
 * Takes plaintext input and returns encrypted fields ready for the server
 */
export async function encryptUnitInput(
  input: UnitInput,
  key: CryptoKey
): Promise<{
  encrypted_title: string;
  encrypted_description: string | null;
  stage_id?: string | null;
}> {
  const encryptedTitle = await encrypt(input.title, key);

  let encryptedDescription: string | null = null;
  if (input.description) {
    const encrypted = await encrypt(input.description, key);
    encryptedDescription = serializeEncryptedData(encrypted);
  }

  return {
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
  const title = await decrypt(parseEncryptedData(row.encrypted_title), key);

  let description: string | null = null;
  if (row.encrypted_description) {
    description = await decrypt(
      parseEncryptedData(row.encrypted_description),
      key
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
  unit_id: string;
  encrypted_title: string;
  encrypted_description: string | null;
  stage_id?: string | null;
}> {
  const encryptedTitle = await encrypt(input.title, key);

  let encryptedDescription: string | null = null;
  if (input.description) {
    const encrypted = await encrypt(input.description, key);
    encryptedDescription = serializeEncryptedData(encrypted);
  }

  return {
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
  const title = await decrypt(parseEncryptedData(row.encrypted_title), key);

  let description: string | null = null;
  if (row.encrypted_description) {
    description = await decrypt(
      parseEncryptedData(row.encrypted_description),
      key
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
  space_id: string;
  encrypted_title: string;
  encrypted_description: string | null;
  stage_id?: string | null;
}> {
  const encryptedTitle = await encrypt(input.title, key);

  let encryptedDescription: string | null = null;
  if (input.description) {
    const encrypted = await encrypt(input.description, key);
    encryptedDescription = serializeEncryptedData(encrypted);
  }

  return {
    space_id: input.space_id,
    encrypted_title: serializeEncryptedData(encryptedTitle),
    encrypted_description: encryptedDescription,
    stage_id: input.stage_id,
  };
}

/**
 * Decrypt an Item row from the database
 */
export async function decryptItemRow(
  row: ItemRow,
  key: CryptoKey
): Promise<Item> {
  const title = await decrypt(parseEncryptedData(row.encrypted_title), key);

  let description: string | null = null;
  if (row.encrypted_description) {
    description = await decrypt(
      parseEncryptedData(row.encrypted_description),
      key
    );
  }

  return {
    id: row.id,
    space_id: row.space_id,
    user_id: row.user_id,
    title,
    description,
    stage_id: row.stage_id,
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
): Promise<{ encrypted_name: string }> {
  const encryptedName = await encrypt(input.name, key);
  return {
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
  const name = await decrypt(parseEncryptedData(row.encrypted_name), key);

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
  update: Partial<StageConfigInput>,
  key: CryptoKey
): Promise<{ encrypted_name?: string }> {
  const result: { encrypted_name?: string } = {};

  if (update.name !== undefined) {
    const encrypted = await encrypt(update.name, key);
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
  config_id: string;
  encrypted_name: string;
  color: string | null;
  icon: string;
  sort_order: number;
  default_rows_shown: number;
}> {
  const encryptedName = await encrypt(input.name, key);

  return {
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
  const name = await decrypt(parseEncryptedData(row.encrypted_name), key);

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
  update: Partial<Omit<StageInput, "config_id">>,
  key: CryptoKey
): Promise<{
  encrypted_name?: string;
  color?: string | null;
  icon?: string;
  sort_order?: number;
  default_rows_shown?: number;
}> {
  const result: {
    encrypted_name?: string;
    color?: string | null;
    icon?: string;
    sort_order?: number;
    default_rows_shown?: number;
  } = {};

  if (update.name !== undefined) {
    const encrypted = await encrypt(update.name, key);
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
// UPDATE HELPERS
// =============================================================================

/**
 * Encrypt fields for updating a Unit
 * Only encrypts provided fields (for partial updates)
 */
export async function encryptUnitUpdate(
  update: Partial<UnitInput>,
  key: CryptoKey
): Promise<{
  encrypted_title?: string;
  encrypted_description?: string | null;
}> {
  const result: {
    encrypted_title?: string;
    encrypted_description?: string | null;
  } = {};

  if (update.title !== undefined) {
    const encrypted = await encrypt(update.title, key);
    result.encrypted_title = serializeEncryptedData(encrypted);
  }

  if (update.description !== undefined) {
    if (update.description === null) {
      result.encrypted_description = null;
    } else {
      const encrypted = await encrypt(update.description, key);
      result.encrypted_description = serializeEncryptedData(encrypted);
    }
  }

  return result;
}

/**
 * Encrypt fields for updating a Space
 */
export async function encryptSpaceUpdate(
  update: Partial<Omit<SpaceInput, "unit_id">>,
  key: CryptoKey
): Promise<{
  encrypted_title?: string;
  encrypted_description?: string | null;
}> {
  const result: {
    encrypted_title?: string;
    encrypted_description?: string | null;
  } = {};

  if (update.title !== undefined) {
    const encrypted = await encrypt(update.title, key);
    result.encrypted_title = serializeEncryptedData(encrypted);
  }

  if (update.description !== undefined) {
    if (update.description === null) {
      result.encrypted_description = null;
    } else {
      const encrypted = await encrypt(update.description, key);
      result.encrypted_description = serializeEncryptedData(encrypted);
    }
  }

  return result;
}

/**
 * Encrypt fields for updating an Item
 */
export async function encryptItemUpdate(
  update: Partial<Omit<ItemInput, "space_id">>,
  key: CryptoKey
): Promise<{
  encrypted_title?: string;
  encrypted_description?: string | null;
}> {
  const result: {
    encrypted_title?: string;
    encrypted_description?: string | null;
  } = {};

  if (update.title !== undefined) {
    const encrypted = await encrypt(update.title, key);
    result.encrypted_title = serializeEncryptedData(encrypted);
  }

  if (update.description !== undefined) {
    if (update.description === null) {
      result.encrypted_description = null;
    } else {
      const encrypted = await encrypt(update.description, key);
      result.encrypted_description = serializeEncryptedData(encrypted);
    }
  }

  return result;
}

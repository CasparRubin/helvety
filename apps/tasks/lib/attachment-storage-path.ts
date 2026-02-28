/** Canonical UUID validator used for storage path segments. */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Random prefix validator (`crypto.randomUUID()` without dashes). */
const PREFIX_REGEX = /^[0-9a-f]{32}$/i;

/** Check whether a value is a UUID. */
function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/** Check whether a value is a valid attachment path prefix. */
function isValidPrefix(value: string): boolean {
  return PREFIX_REGEX.test(value);
}

/** Split a storage path into `[prefix, ownerId, attachmentId]` if canonical. */
function splitStoragePath(path: string): [string, string, string] | null {
  const trimmed = path.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.startsWith("/")) {
    return null;
  }

  const parts = trimmed.split("/");
  if (parts.length !== 3) {
    return null;
  }

  const [prefix, ownerId, attachmentId] = parts;
  if (!prefix || !ownerId || !attachmentId) {
    return null;
  }

  return [prefix, ownerId, attachmentId];
}

/** Generate a high-entropy attachment path prefix. */
export function generateAttachmentStoragePrefix(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

/** Verify the attachment storage path has strict `prefix/userId/attachmentId` shape. */
export function isValidAttachmentStoragePath(path: string): boolean {
  const parsed = splitStoragePath(path);
  if (!parsed) return false;
  const [prefix, ownerId, attachmentId] = parsed;
  return isValidPrefix(prefix) && isUuid(ownerId) && isUuid(attachmentId);
}

/** Extract the owning user ID from a valid attachment path. */
export function getAttachmentPathOwner(path: string): string | null {
  const parsed = splitStoragePath(path);
  if (!parsed) return null;
  const [, ownerId] = parsed;
  return isUuid(ownerId) ? ownerId : null;
}

/** Build a canonical attachment path from validated UUID segments. */
export function buildAttachmentStoragePath(
  userId: string,
  attachmentId: string,
  prefix: string = generateAttachmentStoragePrefix()
): string {
  if (!isValidPrefix(prefix) || !isUuid(userId) || !isUuid(attachmentId)) {
    throw new Error("Invalid attachment path components");
  }
  return `${prefix}/${userId}/${attachmentId}`;
}

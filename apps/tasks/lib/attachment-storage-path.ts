/** Canonical UUID validator used for storage path segments. */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Check whether a value is a UUID. */
function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/** Split a storage path into `[ownerId, attachmentId]` if canonical. */
function splitStoragePath(path: string): [string, string] | null {
  const trimmed = path.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.startsWith("/")) {
    return null;
  }

  const parts = trimmed.split("/");
  if (parts.length !== 2) {
    return null;
  }

  const [ownerId, attachmentId] = parts;
  if (!ownerId || !attachmentId) {
    return null;
  }

  return [ownerId, attachmentId];
}

/** Verify the attachment storage path has strict `userId/attachmentId` shape. */
export function isValidAttachmentStoragePath(path: string): boolean {
  const parsed = splitStoragePath(path);
  if (!parsed) return false;
  const [ownerId, attachmentId] = parsed;
  return isUuid(ownerId) && isUuid(attachmentId);
}

/** Extract the owning user ID from a valid attachment path. */
export function getAttachmentPathOwner(path: string): string | null {
  const parsed = splitStoragePath(path);
  if (!parsed) return null;
  const [ownerId] = parsed;
  return isUuid(ownerId) ? ownerId : null;
}

/** Build a canonical attachment path from validated UUID segments. */
export function buildAttachmentStoragePath(
  userId: string,
  attachmentId: string
): string {
  if (!isUuid(userId) || !isUuid(attachmentId)) {
    throw new Error("Invalid attachment path components");
  }
  return `${userId}/${attachmentId}`;
}

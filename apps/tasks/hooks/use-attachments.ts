"use client";

import {
  normalizeActionError,
  shouldForceHardLogout,
} from "@helvety/shared/auth-errors";
import { ENTITY_LIMITS, TOAST_DURATIONS } from "@helvety/shared/constants";
import { createBrowserClient } from "@helvety/shared/supabase/client";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { forceHardLogout } from "@helvety/ui/hard-logout";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  getAttachments,
  createAttachment,
  deleteAttachment,
  logAttachmentDownload,
} from "@/app/actions/attachment-actions";
import {
  buildAttachmentStoragePath,
  generateAttachmentStoragePrefix,
  getAttachmentPathOwner,
  isValidAttachmentStoragePath,
} from "@/lib/attachment-storage-path";
import { ATTACHMENT_MAX_SIZE_BYTES, ATTACHMENT_BUCKET } from "@/lib/constants";
import {
  useEncryptionContext,
  encryptBinary,
  decryptBinary,
  encryptAttachmentMetadata,
  decryptAttachmentRows,
} from "@/lib/crypto";
import {
  shouldCompress,
  compressBuffer,
  decompressBuffer,
} from "@/lib/crypto/compression";
import { sanitizeFilename } from "@/lib/sanitize-filename";

import type { Attachment } from "@/lib/types";

/**
 * Upload progress state for a single file
 */
export interface UploadProgress {
  /** Unique identifier for this upload */
  id: string;
  /** Original file name (for display during upload) */
  filename: string;
  /** Upload status */
  status: "encrypting" | "uploading" | "saving" | "done" | "error";
  /** Error message if status is "error" */
  error?: string;
}

/** Return type of the useAttachments hook. */
interface UseAttachmentsReturn {
  /** List of decrypted attachments */
  attachments: Attachment[];
  /** Whether attachments are being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Currently in-progress uploads */
  uploads: UploadProgress[];
  /** Refresh attachments from server */
  refresh: () => Promise<void>;
  /** Upload a file (encrypt + upload to storage + save metadata) */
  upload: (file: File) => Promise<boolean>;
  /** Delete an attachment */
  remove: (id: string) => Promise<boolean>;
  /** Download and decrypt an attachment file, returning an object URL */
  downloadUrl: (attachment: Attachment) => Promise<string | null>;
  /** Download and trigger browser file save for an attachment */
  downloadFile: (attachment: Attachment) => Promise<void>;
}

/** Force the centralized logout flow when auth/E2EE state is invalid. */
function triggerHardLogoutForError(rawError?: string | null): boolean {
  const normalized = normalizeActionError(rawError);
  if (!shouldForceHardLogout(normalized)) {
    return false;
  }
  void forceHardLogout(window.location.href);
  return true;
}

/**
 * Hook to manage encrypted file attachments for a specific Item.
 *
 * Handles the full E2EE lifecycle:
 * - Upload: File → compress (if beneficial) → encrypt binary → upload to Storage → encrypt metadata → save DB row
 * - Download: Fetch encrypted blob → decrypt binary → decompress (if compressed) → create object URL
 * - Delete: Delete DB row + storage file via server action
 */
export function useAttachments(itemId: string): UseAttachmentsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  // Cache for decrypted object URLs (keyed by attachment id)
  const urlCacheRef = useRef<Map<string, string>>(new Map());

  // Clean up object URLs on unmount
  useEffect(() => {
    const cache = urlCacheRef.current;
    return () => {
      for (const url of cache.values()) {
        URL.revokeObjectURL(url);
      }
      cache.clear();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !itemId) {
      setAttachments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getAttachments(itemId);
      if (!result.success) {
        if (triggerHardLogoutForError(result.error)) {
          return;
        }
        const msg = result.error ?? "Failed to fetch attachments";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setAttachments([]);
        return;
      }

      const decrypted = await decryptAttachmentRows(result.data, masterKey);
      setAttachments(decrypted);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch attachments";
      if (triggerHardLogoutForError(msg)) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setAttachments([]);
    } finally {
      setIsLoading(false);
    }
  }, [itemId, masterKey, isUnlocked]);

  /**
   * Upload a file: compress (if beneficial) → encrypt → upload to storage → save metadata
   */
  const upload = useCallback(
    async (file: File): Promise<boolean> => {
      if (!masterKey) {
        void forceHardLogout(window.location.href);
        return false;
      }

      if (attachments.length >= ENTITY_LIMITS.MAX_ATTACHMENTS_PER_ITEM) {
        const msg = `Attachment limit reached. Maximum is ${ENTITY_LIMITS.MAX_ATTACHMENTS_PER_ITEM} per item.`;
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }

      // Client-side file size validation
      if (file.size > ATTACHMENT_MAX_SIZE_BYTES) {
        const maxMB = Math.round(ATTACHMENT_MAX_SIZE_BYTES / (1024 * 1024));
        toast.error(`File too large. Maximum size is ${maxMB}MB.`, {
          duration: TOAST_DURATIONS.ERROR,
        });
        return false;
      }

      // Unique ID for tracking this upload in the UI
      const uploadId = crypto.randomUUID();

      // Add to uploads list
      setUploads((prev) => [
        ...prev,
        { id: uploadId, filename: file.name, status: "encrypting" },
      ]);

      try {
        // 1. Read file as ArrayBuffer
        const fileBuffer = await file.arrayBuffer();

        // 2. Optionally compress, then encrypt the file binary
        const isCompressed = shouldCompress(
          file.type || "application/octet-stream",
          file.size
        );
        const dataToEncrypt = isCompressed
          ? await compressBuffer(fileBuffer)
          : fileBuffer;
        const encryptedBuffer = await encryptBinary(dataToEncrypt, masterKey);

        // 3. Encrypt file metadata (returns id and encrypted_metadata for DB)
        const { id: attachmentId, encrypted_metadata: encryptedMetadata } =
          await encryptAttachmentMetadata(
            {
              filename: file.name,
              mime_type: file.type || "application/octet-stream",
              size: file.size,
              ...(isCompressed ? { compressed: true } : {}),
            },
            masterKey
          );

        // 4. Upload encrypted blob to Supabase Storage
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId ? { ...u, status: "uploading" } : u
          )
        );

        const supabase = createBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Not authenticated");
        }

        const storagePrefix = generateAttachmentStoragePrefix();
        const storagePath = buildAttachmentStoragePath(
          user.id,
          attachmentId,
          storagePrefix
        );
        const encryptedBlob = new Blob([encryptedBuffer], {
          type: "application/octet-stream",
        });

        const { error: uploadError } = await supabase.storage
          .from(ATTACHMENT_BUCKET)
          .upload(storagePath, encryptedBlob, {
            contentType: "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // 5. Save the attachment record via server action
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, status: "saving" } : u))
        );

        const result = await createAttachment(
          {
            id: attachmentId,
            item_id: itemId,
            storage_path: storagePath,
            encrypted_metadata: encryptedMetadata,
          },
          csrfToken
        );

        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          // Try to clean up the uploaded file on failure
          await supabase.storage.from(ATTACHMENT_BUCKET).remove([storagePath]);
          throw new Error(result.error ?? "Failed to save attachment");
        }

        // 6. Mark upload as done and refresh
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, status: "done" } : u))
        );

        // Remove from uploads list after a short delay
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== uploadId));
        }, 2000);

        await refresh();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload file";
        if (triggerHardLogoutForError(errorMessage)) {
          return false;
        }
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? { ...u, status: "error", error: errorMessage }
              : u
          )
        );

        // Remove failed upload from list after a longer delay
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== uploadId));
        }, 5000);

        toast.error(errorMessage, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [masterKey, attachments.length, csrfToken, itemId, refresh]
  );

  /**
   * Delete an attachment (DB record + storage file)
   */
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const result = await deleteAttachment(id, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to delete attachment", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Revoke cached URL if exists
        const cachedUrl = urlCacheRef.current.get(id);
        if (cachedUrl) {
          URL.revokeObjectURL(cachedUrl);
          urlCacheRef.current.delete(id);
        }

        await refresh();
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete attachment";
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [csrfToken, refresh]
  );

  /**
   * Download and decrypt an attachment, returning an object URL.
   * Results are cached for the lifetime of the hook.
   */
  const downloadUrl = useCallback(
    async (attachment: Attachment): Promise<string | null> => {
      if (!masterKey) {
        void forceHardLogout(window.location.href);
        return null;
      }

      // Return cached URL if available
      const cached = urlCacheRef.current.get(attachment.id);
      if (cached) {
        return cached;
      }

      try {
        // Download the encrypted blob from Supabase Storage
        const supabase = createBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Not authenticated");
        }
        if (
          !isValidAttachmentStoragePath(attachment.storage_path) ||
          getAttachmentPathOwner(attachment.storage_path) !== user.id
        ) {
          throw new Error("Invalid attachment storage path");
        }
        const { data: blob, error: downloadError } = await supabase.storage
          .from(ATTACHMENT_BUCKET)
          .download(attachment.storage_path);

        if (downloadError || !blob) {
          throw new Error(
            `Failed to download file: ${downloadError?.message ?? "No data"}`
          );
        }

        // Decrypt the binary data
        const encryptedBuffer = await blob.arrayBuffer();
        const decryptedBuffer = await decryptBinary(encryptedBuffer, masterKey);

        // Decompress if the file was compressed before encryption
        const finalBuffer = attachment.metadata.compressed
          ? await decompressBuffer(decryptedBuffer)
          : decryptedBuffer;

        // Create an object URL
        const decryptedBlob = new Blob([finalBuffer], {
          type: attachment.metadata.mime_type,
        });
        const url = URL.createObjectURL(decryptedBlob);

        // Cache the URL
        urlCacheRef.current.set(attachment.id, url);

        // Non-blocking server-side audit event (IP/timestamp/user linkage).
        void logAttachmentDownload(attachment.id, csrfToken);

        return url;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to download file";
        if (triggerHardLogoutForError(message)) {
          return null;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return null;
      }
    },
    [masterKey, csrfToken]
  );

  /**
   * Download and decrypt an attachment, then trigger a browser file save.
   */
  const downloadFile = useCallback(
    async (attachment: Attachment): Promise<void> => {
      const url = await downloadUrl(attachment);
      if (!url) return;

      // Trigger file download (sanitize filename to prevent path traversal)
      const a = document.createElement("a");
      a.href = url;
      a.download = sanitizeFilename(attachment.metadata.filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [downloadUrl]
  );

  // Auto-fetch attachments when ready
  useEffect(() => {
    if (isUnlocked && masterKey && itemId) {
      void refresh();
    }
  }, [isUnlocked, masterKey, itemId, refresh]);

  return {
    attachments,
    isLoading,
    error,
    uploads,
    refresh,
    upload,
    remove,
    downloadUrl,
    downloadFile,
  };
}

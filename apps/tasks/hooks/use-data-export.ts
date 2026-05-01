"use client";

import { ERROR_MESSAGES, TOAST_DURATIONS } from "@helvety/shared/constants";
import { logger } from "@helvety/shared/logger";
import { useState, useCallback } from "react";
import { toast } from "sonner";

import { downloadTaskDataExport } from "@/lib/data-export";

/**
 * Hook for exporting decrypted task data as JSON.
 *
 * Encapsulates the export flow: loading state, error handling, and toast
 * notifications. Used by the flat item dashboard.
 *
 * @param masterKey - The user's decryption key from EncryptionContext
 */
export function useDataExport(masterKey: CryptoKey | null) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = useCallback(async () => {
    if (!masterKey) return;
    setIsExporting(true);
    try {
      await downloadTaskDataExport(masterKey);
    } catch (error) {
      logger.logUnexpectedError("Data export failed", error);
      toast.error(ERROR_MESSAGES.EXPORT_FAILED, {
        duration: TOAST_DURATIONS.ERROR,
      });
    } finally {
      setIsExporting(false);
    }
  }, [masterKey]);

  return { isExporting, handleExportData };
}

"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

import { ERROR_MESSAGES, TOAST_DURATIONS } from "@/lib/constants";
import { downloadTaskDataExport } from "@/lib/data-export";
import { logger } from "@/lib/logger";

/**
 * Hook for exporting decrypted task data as JSON (nDSG Art. 28 compliance).
 *
 * Encapsulates the export flow: loading state, error handling, and toast
 * notifications. Used by all three dashboard components (units, spaces, items).
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
      logger.error("Data export failed:", error);
      toast.error(ERROR_MESSAGES.EXPORT_FAILED, {
        duration: TOAST_DURATIONS.ERROR,
      });
    } finally {
      setIsExporting(false);
    }
  }, [masterKey]);

  return { isExporting, handleExportData };
}

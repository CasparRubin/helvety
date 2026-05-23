"use client";

import { ERROR_MESSAGES, TOAST_DURATIONS } from "@helvety/shared/constants";
import { logger } from "@helvety/shared/logger";
import { useCallback, useState } from "react";
import { toast } from "sonner";

/**
 * Hook for exporting decrypted E2EE entity data as JSON.
 *
 * @param masterKey - The user's decryption key from EncryptionContext
 * @param downloadFn - App-specific export function from `lib/data-export.ts`
 */
export function useE2eeDataExport(
  masterKey: CryptoKey | null,
  downloadFn: (key: CryptoKey) => Promise<void>
) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = useCallback(async () => {
    if (!masterKey) return;
    setIsExporting(true);
    try {
      await downloadFn(masterKey);
    } catch (error) {
      logger.logUnexpectedError("Data export failed", error);
      toast.error(ERROR_MESSAGES.EXPORT_FAILED, {
        duration: TOAST_DURATIONS.ERROR,
      });
    } finally {
      setIsExporting(false);
    }
  }, [downloadFn, masterKey]);

  return { isExporting, handleExportData };
}

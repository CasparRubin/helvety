"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  downloadLinksExport,
  exportDecryptedLinkData,
} from "@/lib/data-export";

/**
 *
 */
export function useDataExport(masterKey: CryptoKey | null) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = useCallback(async () => {
    if (!masterKey) {
      toast.error("Unlock encryption to export data");
      return;
    }
    setIsExporting(true);
    try {
      const data = await exportDecryptedLinkData(masterKey);
      downloadLinksExport(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export links";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  }, [masterKey]);

  return { isExporting, handleExportData };
}

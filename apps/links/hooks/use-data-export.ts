"use client";

import { useE2eeDataExport } from "@helvety/ui/hooks/use-e2ee-data-export";

import { downloadLinkDataExport } from "@/lib/data-export";

/** Hook for exporting decrypted link data as JSON. */
export function useDataExport(masterKey: CryptoKey | null) {
  return useE2eeDataExport(masterKey, downloadLinkDataExport);
}

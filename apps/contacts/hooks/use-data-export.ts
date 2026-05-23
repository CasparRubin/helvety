"use client";

import { useE2eeDataExport } from "@helvety/ui/hooks/use-e2ee-data-export";

import { downloadContactDataExport } from "@/lib/data-export";

/** Hook for exporting decrypted contact data as JSON. */
export function useDataExport(masterKey: CryptoKey | null) {
  return useE2eeDataExport(masterKey, downloadContactDataExport);
}

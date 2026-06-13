/** Builds the standard plaintext-export confirmation copy for E2EE vault zones. */
export function buildPlaintextExportWarning(entityLabel: string): string {
  return `This export file contains decrypted plaintext ${entityLabel} data and can be read by anyone with access to your device. Continue?`;
}

/** Options for {@link downloadEncryptedJsonExport}. */
export interface DownloadEncryptedJsonExportOptions<T> {
  masterKey: CryptoKey;
  buildExportData: (masterKey: CryptoKey) => Promise<T>;
  filenamePrefix: string;
  entityLabel: string;
  requireConfirmation?: boolean;
}

/**
 * Fetch/decrypt via `buildExportData`, optionally confirm, then download JSON.
 * Used by E2EE zone `lib/data-export.ts` modules.
 */
export async function downloadEncryptedJsonExport<T>({
  masterKey,
  buildExportData,
  filenamePrefix,
  entityLabel,
  requireConfirmation = true,
}: DownloadEncryptedJsonExportOptions<T>): Promise<void> {
  if (
    requireConfirmation &&
    !window.confirm(buildPlaintextExportWarning(entityLabel))
  ) {
    return;
  }

  const data = await buildExportData(masterKey);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

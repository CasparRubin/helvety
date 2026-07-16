/**
 * Zone wrapper: sync PDF.js worker into this app's public/ via shared script.
 */
import { syncPdfWorker } from "../../../scripts/sync-pdf-worker.mjs";

syncPdfWorker().catch((error) => {
  console.error("Failed to sync pdf.worker.min.mjs:", error);
  process.exit(1);
});

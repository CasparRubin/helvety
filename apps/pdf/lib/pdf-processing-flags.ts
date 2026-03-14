/**
 * Default PDF processing behavior flags.
 */
export interface PdfProcessingFlags {
  readonly gpuPipelineEnabled: boolean;
  readonly workerPipelineEnabled: boolean;
  readonly telemetryEnabled: boolean;
}

/**
 * Returns static app defaults for PDF pipeline behavior.
 */
export function getPdfProcessingFlags(): PdfProcessingFlags {
  return {
    gpuPipelineEnabled: true,
    workerPipelineEnabled: true,
    telemetryEnabled: false,
  };
}

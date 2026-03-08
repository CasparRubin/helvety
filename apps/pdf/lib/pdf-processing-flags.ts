/* eslint-disable jsdoc/require-jsdoc */

/**
 * Runtime feature flags for experimental PDF processing paths.
 */
export interface PdfProcessingFlags {
  readonly gpuPipelineEnabled: boolean;
  readonly workerPipelineEnabled: boolean;
  readonly telemetryEnabled: boolean;
}

function parseBooleanFlag(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

/**
 * Reads PDF processing flags from `NEXT_PUBLIC_*` environment variables.
 */
export function getPdfProcessingFlags(): PdfProcessingFlags {
  return {
    gpuPipelineEnabled: parseBooleanFlag(
      process.env.NEXT_PUBLIC_PDF_GPU_PIPELINE,
      false
    ),
    workerPipelineEnabled: parseBooleanFlag(
      process.env.NEXT_PUBLIC_PDF_WORKER_PIPELINE,
      true
    ),
    telemetryEnabled: parseBooleanFlag(
      process.env.NEXT_PUBLIC_PDF_PIPELINE_TELEMETRY,
      false
    ),
  };
}

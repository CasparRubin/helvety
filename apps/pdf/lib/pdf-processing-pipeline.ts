/* eslint-disable jsdoc/require-jsdoc */

import { getRenderingCapabilities } from "@/lib/feature-detection";
import { getPdfProcessingFlags } from "@/lib/pdf-processing-flags";

export type PdfProcessingPipeline = "gpu-worker" | "worker" | "main-thread";

export interface PdfProcessingPipelineSelection {
  readonly pipeline: PdfProcessingPipeline;
  readonly reason: string;
}

/**
 * Chooses the most capable processing pipeline available on this client.
 */
export function selectPdfProcessingPipeline(): PdfProcessingPipelineSelection {
  const flags = getPdfProcessingFlags();
  const capabilities = getRenderingCapabilities();

  if (
    flags.gpuPipelineEnabled &&
    flags.workerPipelineEnabled &&
    capabilities.canUseGpuWorkerPipeline
  ) {
    return {
      pipeline: "gpu-worker",
      reason: "gpu-worker supported and enabled",
    };
  }

  if (flags.workerPipelineEnabled && capabilities.canUseWorkerPipeline) {
    return {
      pipeline: "worker",
      reason: "worker supported and enabled",
    };
  }

  return {
    pipeline: "main-thread",
    reason: "falling back to main-thread processing",
  };
}

/* eslint-disable jsdoc/require-jsdoc */

import { getRenderingCapabilities } from "@/lib/feature-detection";

export type PdfProcessingPipeline = "gpu-worker" | "worker" | "main-thread";

export interface PdfProcessingPipelineSelection {
  readonly pipeline: PdfProcessingPipeline;
  readonly reason: string;
}

/**
 * Chooses the most capable processing pipeline available on this client.
 */
export function selectPdfProcessingPipeline(): PdfProcessingPipelineSelection {
  const capabilities = getRenderingCapabilities();

  if (capabilities.canUseGpuWorkerPipeline) {
    return {
      pipeline: "gpu-worker",
      reason: "gpu-worker supported by browser capabilities",
    };
  }

  if (capabilities.canUseWorkerPipeline) {
    return {
      pipeline: "worker",
      reason: "worker supported by browser capabilities",
    };
  }

  return {
    pipeline: "main-thread",
    reason: "falling back to main-thread processing",
  };
}

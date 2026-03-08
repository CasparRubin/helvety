import { afterEach, describe, expect, it, vi } from "vitest";

import * as featureDetection from "./feature-detection";
import * as flags from "./pdf-processing-flags";
import { selectPdfProcessingPipeline } from "./pdf-processing-pipeline";

const DEFAULT_CAPABILITIES: featureDetection.RenderingCapabilities = {
  offscreenCanvas: true,
  imageBitmap: true,
  createImageBitmap: true,
  webgl: true,
  webgl2: true,
  transferControlToOffscreen: true,
  canUseWorkerRendering: true,
  worker: true,
  canUseGpuWorkerPipeline: true,
  canUseWorkerPipeline: true,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("selectPdfProcessingPipeline", () => {
  it("chooses gpu-worker when enabled and supported", () => {
    vi.spyOn(featureDetection, "getRenderingCapabilities").mockReturnValue(
      DEFAULT_CAPABILITIES
    );
    vi.spyOn(flags, "getPdfProcessingFlags").mockReturnValue({
      gpuPipelineEnabled: true,
      workerPipelineEnabled: true,
      telemetryEnabled: false,
    });

    expect(selectPdfProcessingPipeline()).toEqual({
      pipeline: "gpu-worker",
      reason: "gpu-worker supported and enabled",
    });
  });

  it("chooses worker when gpu is disabled but worker is enabled", () => {
    vi.spyOn(featureDetection, "getRenderingCapabilities").mockReturnValue({
      ...DEFAULT_CAPABILITIES,
      canUseGpuWorkerPipeline: false,
      canUseWorkerPipeline: true,
    });
    vi.spyOn(flags, "getPdfProcessingFlags").mockReturnValue({
      gpuPipelineEnabled: false,
      workerPipelineEnabled: true,
      telemetryEnabled: false,
    });

    expect(selectPdfProcessingPipeline()).toEqual({
      pipeline: "worker",
      reason: "worker supported and enabled",
    });
  });

  it("falls back to main-thread when worker is unavailable or disabled", () => {
    vi.spyOn(featureDetection, "getRenderingCapabilities").mockReturnValue({
      ...DEFAULT_CAPABILITIES,
      canUseGpuWorkerPipeline: false,
      canUseWorkerPipeline: false,
    });
    vi.spyOn(flags, "getPdfProcessingFlags").mockReturnValue({
      gpuPipelineEnabled: true,
      workerPipelineEnabled: false,
      telemetryEnabled: false,
    });

    expect(selectPdfProcessingPipeline()).toEqual({
      pipeline: "main-thread",
      reason: "falling back to main-thread processing",
    });
  });
});

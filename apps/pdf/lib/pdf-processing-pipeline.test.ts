import { afterEach, describe, expect, it, vi } from "vitest";

import * as featureDetection from "./feature-detection";
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
  it("chooses gpu-worker when supported", () => {
    vi.spyOn(featureDetection, "getRenderingCapabilities").mockReturnValue(
      DEFAULT_CAPABILITIES
    );

    expect(selectPdfProcessingPipeline()).toEqual({
      pipeline: "gpu-worker",
      reason: "gpu-worker supported by browser capabilities",
    });
  });

  it("chooses worker when gpu-worker is unavailable but worker is supported", () => {
    vi.spyOn(featureDetection, "getRenderingCapabilities").mockReturnValue({
      ...DEFAULT_CAPABILITIES,
      canUseGpuWorkerPipeline: false,
      canUseWorkerPipeline: true,
    });

    expect(selectPdfProcessingPipeline()).toEqual({
      pipeline: "worker",
      reason: "worker supported by browser capabilities",
    });
  });

  it("falls back to main-thread when worker is unavailable", () => {
    vi.spyOn(featureDetection, "getRenderingCapabilities").mockReturnValue({
      ...DEFAULT_CAPABILITIES,
      canUseGpuWorkerPipeline: false,
      canUseWorkerPipeline: false,
    });

    expect(selectPdfProcessingPipeline()).toEqual({
      pipeline: "main-thread",
      reason: "falling back to main-thread processing",
    });
  });
});

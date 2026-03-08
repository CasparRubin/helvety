import { afterEach, describe, expect, it } from "vitest";

import { getPdfProcessingFlags } from "./pdf-processing-flags";

const ORIGINAL_ENV = {
  NEXT_PUBLIC_PDF_GPU_PIPELINE: process.env.NEXT_PUBLIC_PDF_GPU_PIPELINE,
  NEXT_PUBLIC_PDF_WORKER_PIPELINE: process.env.NEXT_PUBLIC_PDF_WORKER_PIPELINE,
  NEXT_PUBLIC_PDF_PIPELINE_TELEMETRY:
    process.env.NEXT_PUBLIC_PDF_PIPELINE_TELEMETRY,
};

afterEach(() => {
  process.env.NEXT_PUBLIC_PDF_GPU_PIPELINE =
    ORIGINAL_ENV.NEXT_PUBLIC_PDF_GPU_PIPELINE;
  process.env.NEXT_PUBLIC_PDF_WORKER_PIPELINE =
    ORIGINAL_ENV.NEXT_PUBLIC_PDF_WORKER_PIPELINE;
  process.env.NEXT_PUBLIC_PDF_PIPELINE_TELEMETRY =
    ORIGINAL_ENV.NEXT_PUBLIC_PDF_PIPELINE_TELEMETRY;
});

describe("getPdfProcessingFlags", () => {
  it("returns defaults when env vars are not set", () => {
    delete process.env.NEXT_PUBLIC_PDF_GPU_PIPELINE;
    delete process.env.NEXT_PUBLIC_PDF_WORKER_PIPELINE;
    delete process.env.NEXT_PUBLIC_PDF_PIPELINE_TELEMETRY;

    expect(getPdfProcessingFlags()).toEqual({
      gpuPipelineEnabled: false,
      workerPipelineEnabled: true,
      telemetryEnabled: false,
    });
  });

  it("parses true-like values", () => {
    process.env.NEXT_PUBLIC_PDF_GPU_PIPELINE = "true";
    process.env.NEXT_PUBLIC_PDF_WORKER_PIPELINE = "yes";
    process.env.NEXT_PUBLIC_PDF_PIPELINE_TELEMETRY = "1";

    expect(getPdfProcessingFlags()).toEqual({
      gpuPipelineEnabled: true,
      workerPipelineEnabled: true,
      telemetryEnabled: true,
    });
  });

  it("parses false-like values", () => {
    process.env.NEXT_PUBLIC_PDF_GPU_PIPELINE = "false";
    process.env.NEXT_PUBLIC_PDF_WORKER_PIPELINE = "0";
    process.env.NEXT_PUBLIC_PDF_PIPELINE_TELEMETRY = "no";

    expect(getPdfProcessingFlags()).toEqual({
      gpuPipelineEnabled: false,
      workerPipelineEnabled: false,
      telemetryEnabled: false,
    });
  });
});

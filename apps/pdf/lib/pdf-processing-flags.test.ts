import { describe, expect, it } from "vitest";

import { getPdfProcessingFlags } from "./pdf-processing-flags";

describe("getPdfProcessingFlags", () => {
  it("returns static pipeline defaults", () => {
    expect(getPdfProcessingFlags()).toEqual({
      gpuPipelineEnabled: true,
      workerPipelineEnabled: true,
      telemetryEnabled: false,
    });
  });
});

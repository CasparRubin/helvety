import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_UPSCALE_MODEL_ID,
  getDefaultEngineForRuntime,
  getModelById,
  UPSCALE_MODEL_BUCKET,
  UPSCALE_MODELS,
} from "@/lib/models";

const STORAGE_PATH_PREFIX = `/storage/v1/object/public/${UPSCALE_MODEL_BUCKET}/`;

describe("upscale model registry", () => {
  const originalWebAssembly = globalThis.WebAssembly;

  afterEach(() => {
    vi.stubGlobal("WebAssembly", originalWebAssembly);
  });

  it("keeps the default Qualcomm general model wired to its external-data sidecar in Supabase Storage", () => {
    const model = getModelById(DEFAULT_UPSCALE_MODEL_ID);

    expect(model).toMatchObject({
      id: "realesr-general-x4v3",
      kind: "onnx",
      sizeMb: 5,
      scale: 4,
    });
    expect(model.url).toContain(
      `${STORAGE_PATH_PREFIX}real_esrgan_general_x4v3.onnx`
    );
    expect(model.externalData).toEqual([
      {
        url: expect.stringContaining(
          `${STORAGE_PATH_PREFIX}real_esrgan_general_x4v3.data`
        ),
        path: "real_esrgan_general_x4v3.data",
        sha256: null,
      },
    ]);
  });

  it("does not expose removed or undocumented engines", () => {
    expect(UPSCALE_MODELS.map((model) => model.id)).toEqual([
      "realesr-general-x4v3",
      "canvas",
    ]);
  });

  it("selects the AI engine by default when WebAssembly is available", () => {
    vi.stubGlobal("WebAssembly", originalWebAssembly);

    expect(getDefaultEngineForRuntime()).toBe(DEFAULT_UPSCALE_MODEL_ID);
  });

  it("selects the canvas fallback when WebAssembly is unavailable", () => {
    vi.stubGlobal("WebAssembly", undefined);

    expect(getDefaultEngineForRuntime()).toBe("canvas");
  });
});

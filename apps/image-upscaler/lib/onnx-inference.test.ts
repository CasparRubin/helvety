import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getModelById } from "@/lib/models";

import type { InferenceSession } from "onnxruntime-web";

const generalModel = getModelById("realesr-general-x4v3");
const generalSidecar = generalModel.externalData?.[0];
if (!generalSidecar) {
  throw new Error(
    "Test setup invariant: realesr-general-x4v3 must have an external-data sidecar."
  );
}

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  releaseSession: vi.fn(),
  getModelBytes: vi.fn(),
  evictModel: vi.fn(),
}));

vi.mock("onnxruntime-web", () => ({
  InferenceSession: {
    create: mocks.createSession,
  },
}));

vi.mock("@/lib/model-cache", () => ({
  getModelBytes: mocks.getModelBytes,
  evictModel: mocks.evictModel,
}));

describe("onnx-inference session loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.releaseSession.mockResolvedValue(undefined);
    mocks.createSession.mockResolvedValue({
      inputNames: ["input"],
      outputNames: ["output"],
      release: mocks.releaseSession,
      run: vi.fn(),
    });
  });

  afterEach(async () => {
    const { disposeAllSessions } = await import("@/lib/onnx-inference");
    await disposeAllSessions();
  });

  it("passes external-data sidecars to ORT for the default Qualcomm model", async () => {
    const mainBytes = new Uint8Array([1, 2, 3]);
    const sidecarBytes = new Uint8Array([4, 5]);
    mocks.getModelBytes.mockResolvedValueOnce({
      bytes: mainBytes,
      externalData: [
        {
          path: "real_esrgan_general_x4v3.data",
          bytes: sidecarBytes,
        },
      ],
      fromCache: false,
    });
    const { ensureSession } = await import("@/lib/onnx-inference");

    await ensureSession(getModelById("realesr-general-x4v3"));

    expect(mocks.getModelBytes).toHaveBeenCalledWith(
      {
        id: "realesr-general-x4v3",
        url: generalModel.url,
        sha256:
          "a848eba3a04de14cc5846733032c3fdc2eee175fd29df264067c3e85ab29d9b3",
        externalData: [
          {
            url: generalSidecar.url,
            path: "real_esrgan_general_x4v3.data",
            sha256:
              "512d0ec9940c2e9d85d27f2952f12a0b77b7841dc22df4ce9f3ea458bc98f37f",
          },
        ],
      },
      undefined
    );
    expect(mocks.createSession).toHaveBeenCalledWith(
      mainBytes,
      expect.objectContaining({
        executionProviders: expect.arrayContaining(["wasm"]),
        graphOptimizationLevel: "all",
        externalData: [
          {
            path: "real_esrgan_general_x4v3.data",
            data: sidecarBytes,
          },
        ],
      })
    );
  });

  it("evicts sidecar URLs when model loading fails", async () => {
    const error = new Error("network exploded");
    mocks.getModelBytes.mockRejectedValueOnce(error);
    const { ensureSession } = await import("@/lib/onnx-inference");

    await expect(
      ensureSession(getModelById("realesr-general-x4v3"))
    ).rejects.toThrow(error);

    expect(mocks.evictModel).toHaveBeenCalledWith(generalModel.url, [
      generalSidecar.url,
    ]);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});

describe("getSessionInputSpatialShape", () => {
  it("returns fixed H/W when metadata shape is static", async () => {
    const { getSessionInputSpatialShape } =
      await import("@/lib/onnx-inference");
    const fakeSession = {
      inputNames: ["image"],
      inputMetadata: [
        {
          isTensor: true,
          shape: [1, 3, 128, 128],
        },
      ],
    };

    expect(
      getSessionInputSpatialShape(fakeSession as unknown as InferenceSession)
    ).toEqual({
      fixedHeight: 128,
      fixedWidth: 128,
    });
  });

  it("treats symbolic or non-positive spatial dims as dynamic", async () => {
    const { getSessionInputSpatialShape } =
      await import("@/lib/onnx-inference");
    const fakeSession = {
      inputNames: ["image"],
      inputMetadata: [
        {
          isTensor: true,
          shape: [1, 3, "height", 0],
        },
      ],
    };

    expect(
      getSessionInputSpatialShape(fakeSession as unknown as InferenceSession)
    ).toEqual({
      fixedHeight: null,
      fixedWidth: null,
    });
  });

  it("returns dynamic shape when metadata is missing", async () => {
    const { getSessionInputSpatialShape } =
      await import("@/lib/onnx-inference");
    const fakeSession = {
      inputNames: ["image"],
      inputMetadata: [],
    };

    expect(
      getSessionInputSpatialShape(fakeSession as unknown as InferenceSession)
    ).toEqual({
      fixedHeight: null,
      fixedWidth: null,
    });
  });

  it("returns dynamic shape when first input is not a tensor", async () => {
    const { getSessionInputSpatialShape } =
      await import("@/lib/onnx-inference");
    const fakeSession = {
      inputNames: ["image"],
      inputMetadata: [
        {
          isTensor: false,
          shape: [1, 3, 128, 128],
        },
      ],
    };

    expect(
      getSessionInputSpatialShape(fakeSession as unknown as InferenceSession)
    ).toEqual({
      fixedHeight: null,
      fixedWidth: null,
    });
  });
});

describe("getEffectiveTileGeometry", () => {
  it("keeps configured tile size for dynamic-shape models", async () => {
    const { getEffectiveTileGeometry } = await import("@/lib/onnx-inference");

    expect(getEffectiveTileGeometry(256, 16, null, null)).toEqual({
      tileSize: 256,
      stride: 240,
    });
  });

  it("clamps tile size to fixed model dimensions", async () => {
    const { getEffectiveTileGeometry } = await import("@/lib/onnx-inference");

    expect(getEffectiveTileGeometry(256, 16, 128, 128)).toEqual({
      tileSize: 128,
      stride: 112,
    });
  });

  it("never returns a zero or negative stride", async () => {
    const { getEffectiveTileGeometry } = await import("@/lib/onnx-inference");

    expect(getEffectiveTileGeometry(8, 16, 8, 8)).toEqual({
      tileSize: 8,
      stride: 1,
    });
  });
});

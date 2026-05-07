import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getModelById } from "@/lib/models";

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

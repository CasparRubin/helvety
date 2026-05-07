import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { evictModel, getModelBytes, MODEL_CACHE_NAME } from "@/lib/model-cache";

/* eslint-disable jsdoc/require-jsdoc */

function bytes(values: readonly number[]): Uint8Array {
  return new Uint8Array(values);
}

function body(values: readonly number[]): ArrayBuffer {
  const raw = bytes(values);
  return raw.buffer.slice(
    raw.byteOffset,
    raw.byteOffset + raw.byteLength
  ) as ArrayBuffer;
}

function createMemoryCache() {
  const entries = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (url: string) => entries.get(url)),
    put: vi.fn(async (url: string, response: Response) => {
      entries.set(url, response.clone());
    }),
    delete: vi.fn(async (url: string) => entries.delete(url)),
  };
  const caches = {
    open: vi.fn(async (name: string) => {
      if (name !== MODEL_CACHE_NAME) {
        throw new Error(`unexpected cache name: ${name}`);
      }
      return cache;
    }),
  };
  return { cache, caches, entries };
}

describe("model-cache", () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.stubGlobal("fetch", originalFetch);
    vi.stubGlobal("caches", originalCaches);
  });

  it("downloads and caches ONNX external-data sidecars with their protobuf path", async () => {
    const { cache, caches } = createMemoryCache();
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith(".onnx")) {
        return new Response(body([1, 2, 3]), {
          headers: { "content-length": "3" },
        });
      }
      if (url.endsWith(".data")) {
        return new Response(body([4, 5]), {
          headers: { "content-length": "2" },
        });
      }
      return new Response(null, { status: 404, statusText: "Not Found" });
    });
    vi.stubGlobal("caches", caches);
    vi.stubGlobal("fetch", fetchMock);
    const onProgress = vi.fn();

    const result = await getModelBytes(
      {
        id: "realesr-general-x4v3",
        url: "/image-upscaler/models/real_esrgan_general_x4v3.onnx",
        sha256: null,
        externalData: [
          {
            url: "/image-upscaler/models/real_esrgan_general_x4v3.data",
            path: "real_esrgan_general_x4v3.data",
            sha256: null,
          },
        ],
      },
      onProgress
    );

    expect(result.fromCache).toBe(false);
    expect(result.bytes).toEqual(bytes([1, 2, 3]));
    expect(result.externalData).toEqual([
      {
        path: "real_esrgan_general_x4v3.data",
        bytes: bytes([4, 5]),
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/image-upscaler/models/real_esrgan_general_x4v3.onnx"
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/image-upscaler/models/real_esrgan_general_x4v3.data"
    );
    expect(cache.put).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith({
      modelId: "realesr-general-x4v3",
      received: 3,
      total: 3,
    });
    expect(onProgress).toHaveBeenCalledWith({
      modelId: "realesr-general-x4v3",
      received: 2,
      total: 2,
    });
  });

  it("serves self-contained model descriptors from cache without externalData", async () => {
    const { caches, entries } = createMemoryCache();
    entries.set("/test/self-contained.onnx", new Response(body([9, 8, 7])));
    const fetchMock = vi.fn();
    vi.stubGlobal("caches", caches);
    vi.stubGlobal("fetch", fetchMock);

    const result = await getModelBytes({
      id: "synthetic-self-contained",
      url: "/test/self-contained.onnx",
      sha256: null,
      externalData: null,
    });

    expect(result).toEqual({
      bytes: bytes([9, 8, 7]),
      externalData: [],
      fromCache: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("evicts both main model files and external-data sidecars", async () => {
    const { cache, caches } = createMemoryCache();
    vi.stubGlobal("caches", caches);

    await evictModel("/model.onnx", ["/model.data"]);

    expect(cache.delete).toHaveBeenCalledWith("/model.onnx");
    expect(cache.delete).toHaveBeenCalledWith("/model.data");
  });
});

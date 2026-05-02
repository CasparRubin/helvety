import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loggerLog: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    log: mocks.loggerLog,
    warn: mocks.loggerWarn,
  },
}));

import {
  imageBitmapCacheInternals,
  getImageBitmapCache,
} from "./imagebitmap-cache";

/** Build a test bitmap with an externally assertable close spy. */
function createBitmap(
  width: number,
  height: number
): { bitmap: ImageBitmap; closeSpy: ReturnType<typeof vi.fn> } {
  const closeSpy = vi.fn();
  const bitmap = {
    close: closeSpy,
    height,
    width,
  } as unknown as ImageBitmap;
  return { bitmap, closeSpy };
}

describe("imagebitmap-cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    imageBitmapCacheInternals.resetForTests();
  });

  it("evicts least recently used entry when max size is exceeded", () => {
    const cache = getImageBitmapCache(1, 10_000_000);
    const first = createBitmap(10, 10);
    const second = createBitmap(20, 20);

    cache.set("first", first.bitmap);
    cache.set("second", second.bitmap);

    expect(cache.has("first")).toBe(false);
    expect(cache.has("second")).toBe(true);
    expect(first.closeSpy).toHaveBeenCalled();
  });

  it("warns when requesting different limits after initialization", () => {
    getImageBitmapCache(5, 5_000_000);
    getImageBitmapCache(10, 10_000_000);

    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      "ImageBitmap cache already initialized; ignoring new limits",
      expect.objectContaining({
        initialMaxSize: 5,
        requestedMaxSize: 10,
      })
    );
  });
});

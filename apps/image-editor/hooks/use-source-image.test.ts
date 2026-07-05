import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSourceImage } from "./use-source-image";

/** Minimal `Image` stub for hook tests. */
class MockImage {
  naturalWidth = 640;
  naturalHeight = 480;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    this.onload?.();
  }
}

describe("useSourceImage", () => {
  const originalImage = globalThis.Image;
  const revokeObjectURL = vi.fn();
  const createObjectURL = vi.fn(() => "blob:mock-image");

  beforeEach(() => {
    vi.stubGlobal("Image", MockImage);
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    vi.stubGlobal("Image", originalImage);
    vi.clearAllMocks();
  });

  it("loads a file and exposes natural dimensions", async () => {
    const { result } = renderHook(() => useSourceImage());
    const file = new File(["pixels"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current.loadFile(file);
    });

    expect(result.current.source?.file).toBe(file);
    expect(result.current.source?.naturalWidth).toBe(640);
    expect(result.current.source?.naturalHeight).toBe(480);
    expect(createObjectURL).toHaveBeenCalledWith(file);
  });

  it("revokes the object URL when cleared", async () => {
    const { result } = renderHook(() => useSourceImage());
    const file = new File(["pixels"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current.loadFile(file);
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.source).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-image");
  });

  it("revokes the object URL on unmount", async () => {
    const { result, unmount } = renderHook(() => useSourceImage());
    const file = new File(["pixels"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current.loadFile(file);
    });

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-image");
  });
});

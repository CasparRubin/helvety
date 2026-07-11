import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  recognize: vi.fn(),
  dispose: vi.fn(),
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/ocr-worker-client", () => ({
  createOcrWorkerClient: () => ({
    recognize: mocks.recognize,
    dispose: mocks.dispose,
  }),
}));

vi.mock("@helvety/ui/sonner", () => ({ toast: mocks.toast }));

import { useOcrJob } from "./use-ocr-job";

/** Builds a small in-memory PNG File for image-path tests. */
function imageFile(): File {
  return new File(["x"], "scan.png", { type: "image/png" });
}

describe("useOcrJob", () => {
  beforeEach(() => {
    mocks.recognize.mockReset();
    mocks.dispose.mockReset();
    mocks.toast.error.mockReset();
    mocks.toast.info.mockReset();
    mocks.toast.success.mockReset();
  });

  it("extracts text from an image and reports done", async () => {
    mocks.recognize.mockResolvedValue("hello text");
    const { result } = renderHook(() => useOcrJob());

    act(() => {
      result.current.loadFile(imageFile());
    });

    expect(result.current.hasFile).toBe(true);
    expect(result.current.inputKind).toBe("image");

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(result.current.text).toBe("hello text");
    expect(mocks.recognize).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid files without starting a job", () => {
    const { result } = renderHook(() => useOcrJob());

    act(() => {
      result.current.loadFile(
        new File(["x"], "notes.txt", { type: "text/plain" })
      );
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.hasFile).toBe(false);
    expect(mocks.toast.error).toHaveBeenCalledTimes(1);
    expect(mocks.recognize).not.toHaveBeenCalled();
  });

  it("clears the loaded file and extracted text", async () => {
    mocks.recognize.mockResolvedValue("some text");
    const { result } = renderHook(() => useOcrJob());

    act(() => {
      result.current.loadFile(imageFile());
    });
    await waitFor(() => expect(result.current.status).toBe("done"));

    act(() => {
      result.current.clear();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.text).toBe("");
    expect(result.current.hasFile).toBe(false);
  });
});

import * as React from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

const pdfjsMock = vi.hoisted(() => ({
  GlobalWorkerOptions: { workerSrc: "" },
}));

vi.mock("react-pdf", () => ({
  pdfjs: pdfjsMock,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: { logUnexpectedError: vi.fn() },
}));

/** Mounts `usePdfWorker` with optional file type. */
async function renderUsePdfWorkerHook(fileType: "pdf" | "image"): Promise<{
  getCurrent: () => { workerReady: boolean; error: string | null };
  unmount: () => void;
}> {
  const { usePdfWorker } = await import("./use-pdf-worker");
  let current: ReturnType<typeof usePdfWorker> | null = null;
  const container = document.createElement("div");
  const root = createRoot(container);

  /** Captures the latest hook snapshot. */
  function Harness(): null {
    const value = usePdfWorker(fileType);
    React.useEffect(() => {
      current = value;
    }, [value]);
    return null;
  }

  React.act(() => {
    root.render(React.createElement(Harness));
  });

  return {
    getCurrent: () => {
      if (!current) {
        throw new Error("Hook did not initialize");
      }
      return current;
    },
    unmount: () => {
      React.act(() => {
        root.unmount();
      });
    },
  };
}

describe("usePdfWorker", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    pdfjsMock.GlobalWorkerOptions.workerSrc = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets pdfjs workerSrc to the zone public worker path", async () => {
    const hook = await renderUsePdfWorkerHook("pdf");

    await React.act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(pdfjsMock.GlobalWorkerOptions.workerSrc).toBe(
      "/pdf/pdf.worker.min.mjs"
    );
    expect(hook.getCurrent().workerReady).toBe(true);
    expect(hook.getCurrent().error).toBeNull();
    hook.unmount();
  });

  it("skips worker initialization for image file type", async () => {
    const hook = await renderUsePdfWorkerHook("image");

    await React.act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(pdfjsMock.GlobalWorkerOptions.workerSrc).toBe("");
    expect(hook.getCurrent().workerReady).toBe(true);
    hook.unmount();
  });

  it("surfaces an error when react-pdf import fails", async () => {
    vi.resetModules();
    vi.doMock("react-pdf", () => ({
      get pdfjs() {
        throw new Error("worker load failed");
      },
    }));

    const hook = await renderUsePdfWorkerHook("pdf");

    await React.act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(hook.getCurrent().workerReady).toBe(false);
    expect(hook.getCurrent().error).toBe(
      "Unable to load PDF viewer. Please refresh the page and try again."
    );
    hook.unmount();
  });
});

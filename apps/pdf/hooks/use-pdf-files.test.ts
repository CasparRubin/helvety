import * as React from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  convertImageToPdf: vi.fn(),
  formatValidationErrors: vi.fn(),
  generateUniqueFileName: vi.fn((name: string) => name),
  isMobileDevice: vi.fn(() => false),
  loadPdfFromFile: vi.fn(),
  processFile: vi.fn(),
  safeRevokeObjectURL: vi.fn(),
  validateFiles: vi.fn(),
  yieldToBrowserIfNeeded: vi.fn(),
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    log: vi.fn(),
    logUnexpectedError: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@helvety/ui/use-is-mobile", () => ({
  isMobileDevice: mocks.isMobileDevice,
}));

vi.mock("@/lib/batch-processing", () => ({
  yieldToBrowserIfNeeded: mocks.yieldToBrowserIfNeeded,
}));

vi.mock("@/lib/blob-url-utils", () => ({
  safeRevokeObjectURL: mocks.safeRevokeObjectURL,
}));

vi.mock("@/lib/error-formatting", () => ({
  formatValidationErrors: mocks.formatValidationErrors,
}));

vi.mock("@/lib/file-processing", () => ({
  processFile: mocks.processFile,
}));

vi.mock("@/lib/pdf-conversion", () => ({
  convertImageToPdf: mocks.convertImageToPdf,
}));

vi.mock("@/lib/pdf-loading", () => ({
  loadPdfFromFile: mocks.loadPdfFromFile,
}));

vi.mock("@/lib/validation-utils", () => ({
  generateUniqueFileName: mocks.generateUniqueFileName,
  validateFiles: mocks.validateFiles,
}));

import { usePdfFiles } from "./use-pdf-files";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

/** Mounts `usePdfFiles` in a tiny React root for deterministic hook tests. */
function renderUsePdfFilesHook(): {
  getCurrent: () => ReturnType<typeof usePdfFiles>;
  unmount: () => void;
} {
  let current: ReturnType<typeof usePdfFiles> | null = null;
  const container = document.createElement("div");
  const root = createRoot(container);

  /** Exposes the latest hook snapshot from the mounted test component. */
  function Harness(): null {
    const value = usePdfFiles();
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

describe("usePdfFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.validateFiles.mockReturnValue({ valid: true, errors: [] });
    mocks.formatValidationErrors.mockImplementation((errors: string[]) =>
      errors.join(", ")
    );
    mocks.processFile.mockResolvedValue({
      pdfFile: {
        id: "file-1",
        file: new File(["%PDF"], "a.pdf", { type: "application/pdf" }),
        fileType: "pdf",
        name: "a.pdf",
        pageCount: 2,
        pages: [],
        size: 4,
        url: "blob:pdf-1",
      },
    });
  });

  it("returns formatted validation errors and skips processing", async () => {
    mocks.validateFiles.mockReturnValueOnce({
      valid: false,
      errors: ["too big"],
    });
    const onError = vi.fn();
    const hook = renderUsePdfFilesHook();

    await React.act(async () => {
      await hook
        .getCurrent()
        .validateAndAddFiles(
          [new File(["x"], "bad.pdf", { type: "application/pdf" })],
          onError
        );
    });

    expect(mocks.processFile).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("too big");
    hook.unmount();
  });

  it("adds processed files and derives unified page order", async () => {
    const onError = vi.fn();
    const hook = renderUsePdfFilesHook();

    await React.act(async () => {
      await hook
        .getCurrent()
        .validateAndAddFiles(
          [new File(["%PDF"], "a.pdf", { type: "application/pdf" })],
          onError
        );
    });

    expect(hook.getCurrent().pdfFiles).toHaveLength(1);
    expect(
      hook.getCurrent().unifiedPages.map((page) => page.unifiedPageNumber)
    ).toEqual([1, 2]);
    expect(hook.getCurrent().pageOrder).toEqual([1, 2]);
    expect(onError).toHaveBeenLastCalledWith(null);
    hook.unmount();
  });

  it("revokes object URLs when clearing files", async () => {
    const onError = vi.fn();
    const hook = renderUsePdfFilesHook();

    await React.act(async () => {
      await hook
        .getCurrent()
        .validateAndAddFiles(
          [new File(["%PDF"], "a.pdf", { type: "application/pdf" })],
          onError
        );
      hook.getCurrent().clearAll();
    });

    expect(mocks.safeRevokeObjectURL).toHaveBeenCalledWith("blob:pdf-1");
    expect(hook.getCurrent().pdfFiles).toHaveLength(0);
    expect(hook.getCurrent().pageOrder).toEqual([]);
    hook.unmount();
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUsePdfFiles, mockDownloadMerged } = vi.hoisted(() => ({
  mockUsePdfFiles: vi.fn(),
  mockDownloadMerged: vi.fn(),
}));

vi.mock("@/hooks/use-columns", () => ({
  useColumns: () => [3, vi.fn()],
}));

vi.mock("@/hooks/use-pdf-files", () => ({
  usePdfFiles: () => mockUsePdfFiles(),
}));

vi.mock("@/hooks/use-error-handler", () => ({
  useErrorHandler: () => ({
    error: null,
    setError: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-pdf-page-state", () => ({
  usePdfPageState: () => ({
    deletedPages: new Set<number>(),
    pageRotations: {} as Record<number, number>,
    deletedCount: 0,
    rotatedCount: 0,
    resetAll: vi.fn(),
    toggleDelete: vi.fn(),
    rotatePage: vi.fn(),
    resetRotation: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-pdf-processing", () => ({
  usePdfProcessing: () => ({
    isProcessing: false,
    downloadMerged: mockDownloadMerged,
    extractPage: vi.fn(),
  }),
}));

vi.mock("@helvety/shared/hooks/use-drag-drop", () => ({
  useDragDrop: () => ({
    isDragging: false,
    dragHandlers: {},
  }),
}));

vi.mock("@/hooks/use-imagebitmap-memory", () => ({
  useImageBitmapMemory: vi.fn(),
}));

import { HelvetyPdf } from "@/components/helvety-pdf";

/** Minimal `usePdfFiles` return value for shell tests. */
function emptyFilesMock() {
  return {
    pdfFiles: [],
    unifiedPages: [],
    pageOrder: [],
    setPageOrder: vi.fn(),
    validateAndAddFiles: vi.fn(),
    removeFile: vi.fn(),
    clearAll: vi.fn(),
    getCachedPdf: vi.fn(),
  };
}

/** Minimal `usePdfFiles` return value when one PDF is loaded. */
function loadedFilesMock() {
  return {
    ...emptyFilesMock(),
    pdfFiles: [
      {
        id: "file-1",
        file: new File(["%PDF"], "test.pdf", { type: "application/pdf" }),
        url: "blob:test",
        pageCount: 1,
        color: "oklch(0.7 0.1 240)",
        type: "pdf" as const,
      },
    ],
  };
}

describe("HelvetyPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePdfFiles.mockReturnValue(emptyFilesMock());
  });

  it("renders the PDF command bar shell with an accessible add action", () => {
    render(<HelvetyPdf />);

    expect(
      screen.getByRole("button", { name: "Add Files" })
    ).toBeInTheDocument();
  });

  it("wires downloadMerged to the command bar when files are loaded", () => {
    mockUsePdfFiles.mockReturnValue(loadedFilesMock());

    render(<HelvetyPdf />);

    const downloadButton = screen.getByRole("button", { name: "Download PDF" });
    downloadButton.click();
    expect(mockDownloadMerged).toHaveBeenCalledTimes(1);
  });
});

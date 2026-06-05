import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-columns", () => ({
  useColumns: () => [3, vi.fn()],
}));

vi.mock("@/hooks/use-pdf-files", () => ({
  usePdfFiles: () => ({
    pdfFiles: [],
    unifiedPages: [],
    pageOrder: [],
    setPageOrder: vi.fn(),
    validateAndAddFiles: vi.fn(),
    removeFile: vi.fn(),
    clearAll: vi.fn(),
    getCachedPdf: vi.fn(),
  }),
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
    downloadPdf: vi.fn(),
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

describe("HelvetyPdf", () => {
  it("renders the PDF command bar shell with an accessible add action", () => {
    render(<HelvetyPdf />);

    expect(
      screen.getByRole("button", { name: "Add Files" })
    ).toBeInTheDocument();
  });
});

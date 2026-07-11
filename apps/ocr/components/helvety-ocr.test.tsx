import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseOcrJob = vi.fn();
const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));
const downloadMocks = vi.hoisted(() => ({
  downloadBlob: vi.fn(),
  createOcrDownloadName: vi.fn((name: string) => `${name}-ocr.txt`),
}));

vi.mock("@/hooks/use-ocr-job", () => ({
  useOcrJob: () => mockUseOcrJob(),
}));

vi.mock("@helvety/shared/hooks/use-drag-drop", () => ({
  useDragDrop: () => ({
    isDragging: false,
    handleDragEnter: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
  }),
}));

vi.mock("@helvety/ui/sonner", () => ({
  toast: toastMocks,
}));

vi.mock("@/lib/file-download", () => downloadMocks);

import { HelvetyOcr } from "@/components/helvety-ocr";

/** Minimal idle `useOcrJob` return value for shell tests. */
function idleJobMock() {
  return {
    status: "idle" as const,
    progress: null,
    text: "",
    fileName: null,
    inputKind: null,
    language: "eng" as const,
    hasFile: false,
    setLanguage: vi.fn(),
    loadFile: vi.fn(),
    clear: vi.fn(),
  };
}

/** Loaded job mock with extracted text ready for download/copy. */
function loadedJobMock(
  overrides: Partial<ReturnType<typeof idleJobMock>> = {}
) {
  return {
    ...idleJobMock(),
    status: "done" as const,
    text: "Extracted text",
    fileName: "report.pdf",
    inputKind: "pdf" as const,
    hasFile: true,
    ...overrides,
  };
}

describe("HelvetyOcr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOcrJob.mockReturnValue(idleJobMock());
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders the OCR command bar shell with an accessible add action", () => {
    render(<HelvetyOcr />);

    expect(
      screen.getByRole("button", { name: "Add File" })
    ).toBeInTheDocument();
  });

  it("shows the empty-state command bar hint", () => {
    render(<HelvetyOcr />);

    expect(
      screen.getByText("Or use the command bar above to add your file")
    ).toBeInTheDocument();
  });

  it("shows the empty dropzone and local-processing privacy line", () => {
    render(<HelvetyOcr />);

    expect(
      screen.getByText("Drag and drop a PDF or image here")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Processed locally in your browser/i)
    ).toBeInTheDocument();
  });

  it("enables download and clear actions when text is ready", () => {
    mockUseOcrJob.mockReturnValue(loadedJobMock());
    render(<HelvetyOcr />);

    expect(screen.getByRole("button", { name: "Add More" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Download text" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Clear All" })).toBeEnabled();
  });

  it("downloads extracted text through the shared file-download helper", () => {
    mockUseOcrJob.mockReturnValue(loadedJobMock());
    render(<HelvetyOcr />);

    fireEvent.click(screen.getByRole("button", { name: "Download text" }));

    expect(downloadMocks.createOcrDownloadName).toHaveBeenCalledWith(
      "report.pdf"
    );
    expect(downloadMocks.downloadBlob).toHaveBeenCalledTimes(1);
    const [blob, filename] = downloadMocks.downloadBlob.mock.calls[0] as [
      Blob,
      string,
    ];
    expect(blob.type).toBe("text/plain;charset=utf-8");
    expect(filename).toBe("report.pdf-ocr.txt");
  });

  it("shows clear confirmation copy from the command bar", () => {
    const clear = vi.fn();
    mockUseOcrJob.mockReturnValue(loadedJobMock({ clear }));
    render(<HelvetyOcr />);

    fireEvent.click(screen.getByRole("button", { name: "Clear All" }));
    const dialog = screen.getByRole("alertdialog");
    expect(screen.getByText("Clear File?")).toBeInTheDocument();
    expect(clear).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Clear All" }));
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("copies extracted text and shows a success toast", async () => {
    mockUseOcrJob.mockReturnValue(loadedJobMock({ text: "Copied content" }));
    render(<HelvetyOcr />);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await vi.waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "Copied content"
      );
    });
    expect(toastMocks.success).toHaveBeenCalledWith("Copied to clipboard.", {
      duration: TOAST_DURATIONS.SUCCESS,
    });
  });
});

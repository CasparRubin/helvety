import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { OcrWorkspace } from "./ocr-workspace";

/** Renders the workspace with overridable props. */
function renderWorkspace(
  overrides: Partial<Parameters<typeof OcrWorkspace>[0]> = {}
): void {
  const fileInputRef = createRef<HTMLInputElement>();
  render(
    <OcrWorkspace
      hasFile={false}
      status="idle"
      progress={null}
      text=""
      isDragging={false}
      fileInputRef={fileInputRef}
      onPickFile={vi.fn()}
      onFileInputChange={vi.fn()}
      onCopy={vi.fn()}
      {...overrides}
    />
  );
}

describe("OcrWorkspace", () => {
  it("shows the empty dropzone and command-bar hint", () => {
    renderWorkspace();

    expect(
      screen.getByText("Drag and drop a PDF or image here")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Or use the command bar above to add your file")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Processed locally in your browser/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Upload a PDF or image")).toBeInTheDocument();
  });

  it("opens the file picker from the empty dropzone", () => {
    const onPickFile = vi.fn();
    renderWorkspace({ onPickFile });

    fireEvent.click(
      screen.getByLabelText("File drop zone. Click to select a PDF or image.")
    );
    expect(onPickFile).toHaveBeenCalledTimes(1);
  });

  it("shows processing status copy while a job runs", () => {
    renderWorkspace({
      hasFile: true,
      status: "processing",
      progress: { phase: "recognizing", page: 2, totalPages: 5 },
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Recognizing text — page 2 of 5"
    );
  });

  it("shows extracted text and wires copy when done", () => {
    const onCopy = vi.fn();
    renderWorkspace({
      hasFile: true,
      status: "done",
      text: "Hello OCR",
      onCopy,
    });

    expect(screen.getByLabelText("Extracted text")).toHaveValue("Hello OCR");
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("shows the no-text-found empty result state", () => {
    renderWorkspace({
      hasFile: true,
      status: "done",
      text: "   ",
    });

    expect(screen.getByText("No text found")).toBeInTheDocument();
    expect(
      screen.getByText(/couldn't find any readable text/i)
    ).toBeInTheDocument();
  });
});

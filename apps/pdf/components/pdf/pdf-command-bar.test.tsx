import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PdfCommandBar } from "./pdf-command-bar";

describe("PdfCommandBar", () => {
  it("keeps the add action accessible with compact icon-first labels", () => {
    render(
      <PdfCommandBar
        fileCount={0}
        onAddFiles={vi.fn()}
        onDownload={vi.fn()}
        onClearAll={vi.fn()}
        isProcessing={false}
      />
    );

    expect(screen.getByRole("button", { name: "Add Files" })).toBeEnabled();
  });

  it("keeps download action accessible while processing", () => {
    render(
      <PdfCommandBar
        fileCount={1}
        onAddFiles={vi.fn()}
        onDownload={vi.fn()}
        onClearAll={vi.fn()}
        isProcessing={true}
      />
    );

    expect(
      screen.getByRole("button", { name: "Download PDF (processing)" })
    ).toBeDisabled();
  });

  it("uses add-more label and keeps clear-all action available with files", () => {
    render(
      <PdfCommandBar
        fileCount={1}
        onAddFiles={vi.fn()}
        onDownload={vi.fn()}
        onClearAll={vi.fn()}
        isProcessing={false}
      />
    );

    expect(
      screen.getByRole("button", { name: "Add More" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear All" })
    ).toBeInTheDocument();
  });
});

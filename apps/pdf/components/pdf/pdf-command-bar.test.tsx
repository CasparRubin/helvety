import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { PdfCommandBar } from "./pdf-command-bar";

describe("PdfCommandBar", () => {
  /** Renders the command bar into a disposable DOM container. */
  function renderToDom(
    fileCount: number,
    isProcessing: boolean
  ): {
    root: Root;
    container: HTMLDivElement;
  } {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    flushSync(() => {
      root.render(
        <PdfCommandBar
          fileCount={fileCount}
          onAddFiles={vi.fn()}
          onDownload={vi.fn()}
          onClearAll={vi.fn()}
          isProcessing={isProcessing}
        />
      );
    });
    return { root, container };
  }

  it("keeps the add action accessible with compact icon-first labels", () => {
    const { root, container } = renderToDom(0, false);
    expect(
      container.querySelector('button[aria-label="Add Files"]')
    ).not.toBeNull();
    flushSync(() => root.unmount());
    container.remove();
  });

  it("keeps download action accessible while processing", () => {
    const { root, container } = renderToDom(1, true);
    const processingDownload = container.querySelector(
      'button[aria-label="Download PDF (processing)"]'
    );
    expect(processingDownload).not.toBeNull();
    expect(processingDownload).toBeDisabled();
    flushSync(() => root.unmount());
    container.remove();
  });

  it("uses add-more label and keeps clear-all action available with files", () => {
    const { root, container } = renderToDom(1, false);
    expect(
      container.querySelector('button[aria-label="Add More"]')
    ).not.toBeNull();
    const clearAllButton = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("Clear All"));
    expect(clearAllButton).not.toBeNull();
    flushSync(() => root.unmount());
    container.remove();
  });
});

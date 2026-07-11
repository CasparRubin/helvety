import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OcrCommandBar } from "./ocr-command-bar";

/** Renders the command bar with default props overridable per test. */
function renderCommandBar(
  overrides: Partial<Parameters<typeof OcrCommandBar>[0]> = {}
): void {
  render(
    <OcrCommandBar
      hasFile={false}
      isProcessing={false}
      canDownload={false}
      language="eng"
      onAddFile={vi.fn()}
      onDownload={vi.fn()}
      onClearFile={vi.fn()}
      onLanguageChange={vi.fn()}
      {...overrides}
    />
  );
}

describe("OcrCommandBar", () => {
  it("shows Add File and a disabled download before a file is loaded", () => {
    renderCommandBar();

    expect(screen.getByRole("button", { name: "Add File" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Download text" })
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Clear All" })
    ).not.toBeInTheDocument();
  });

  it("wires add and download callbacks once a file is loaded", () => {
    const onAddFile = vi.fn();
    const onDownload = vi.fn();
    renderCommandBar({
      hasFile: true,
      canDownload: true,
      onAddFile,
      onDownload,
    });

    fireEvent.click(screen.getByRole("button", { name: "Add More" }));
    fireEvent.click(screen.getByRole("button", { name: "Download text" }));

    expect(onAddFile).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("disables mutating actions while processing", () => {
    renderCommandBar({ hasFile: true, canDownload: true, isProcessing: true });

    expect(screen.getByRole("button", { name: "Add More" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Download text (processing)" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear All" })).toBeDisabled();
  });

  it("confirms before clearing the file", () => {
    const onClearFile = vi.fn();
    renderCommandBar({ hasFile: true, onClearFile });

    fireEvent.click(screen.getByRole("button", { name: "Clear All" }));
    const dialog = screen.getByRole("alertdialog");
    expect(screen.getByText("Clear File?")).toBeInTheDocument();
    expect(onClearFile).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Clear All" }));
    expect(onClearFile).toHaveBeenCalledTimes(1);
  });

  it("propagates language changes from the mobile settings popover", () => {
    const onLanguageChange = vi.fn();
    renderCommandBar({ onLanguageChange });

    fireEvent.click(screen.getByRole("button", { name: "OCR settings" }));
    fireEvent.change(screen.getByLabelText("Language"), {
      target: { value: "deu" },
    });

    expect(onLanguageChange).toHaveBeenCalledWith("deu");
  });
});

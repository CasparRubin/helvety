import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ImageEditorCommandBar } from "./image-editor-command-bar";

/** Renders the command bar with default props overridable per test. */
function renderCommandBar(
  overrides: Partial<Parameters<typeof ImageEditorCommandBar>[0]> = {}
): void {
  render(
    <ImageEditorCommandBar
      hasImage={false}
      activeTool="select"
      isExporting={false}
      canApplyCrop={false}
      onOpenImage={vi.fn()}
      onReplaceImage={vi.fn()}
      onSetTool={vi.fn()}
      onExport={vi.fn()}
      onClear={vi.fn()}
      onApplyCrop={vi.fn()}
      onResetCrop={vi.fn()}
      onOpenLayers={vi.fn()}
      {...overrides}
    />
  );
}

describe("ImageEditorCommandBar", () => {
  it("shows open image when no file is loaded", () => {
    renderCommandBar();
    expect(screen.getByRole("button", { name: "Open Image" })).toBeEnabled();
  });

  it("wires tool and export callbacks when an image is loaded", async () => {
    const onSetTool = vi.fn();
    const onExport = vi.fn();

    renderCommandBar({
      hasImage: true,
      onSetTool,
      onExport,
    });

    fireEvent.click(screen.getByRole("button", { name: "Text" }));

    const exportButton = screen.getByRole("button", { name: "Export" });
    fireEvent.pointerDown(exportButton);
    fireEvent.click(exportButton);
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Export PNG" })
    );

    expect(onSetTool).toHaveBeenCalledWith("text");
    expect(onExport).toHaveBeenCalledWith("png");
  });

  it("shows crop actions when crop tool is active", () => {
    renderCommandBar({
      hasImage: true,
      activeTool: "crop",
      canApplyCrop: true,
    });

    expect(screen.getByRole("button", { name: "Apply Crop" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reset Crop" })).toBeEnabled();
  });

  it("shows replace image when a file is already loaded", () => {
    renderCommandBar({ hasImage: true });
    expect(screen.getByRole("button", { name: "Replace Image" })).toBeEnabled();
  });

  it("exports jpeg from the dropdown menu", async () => {
    const onExport = vi.fn();
    renderCommandBar({ hasImage: true, onExport });

    const exportButton = screen.getByRole("button", { name: "Export" });
    fireEvent.pointerDown(exportButton);
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Export JPEG" })
    );

    expect(onExport).toHaveBeenCalledWith("jpeg");
  });

  it("disables export while exporting", () => {
    renderCommandBar({ hasImage: true, isExporting: true });
    expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();
  });

  it("confirms clear before invoking callback", () => {
    const onClear = vi.fn();
    renderCommandBar({ hasImage: true, onClear });

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Clear annotations?")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Clear" }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("opens the mobile layers sheet callback", () => {
    const onOpenLayers = vi.fn();
    renderCommandBar({ hasImage: true, onOpenLayers });

    fireEvent.click(screen.getByRole("button", { name: "Layers" }));
    expect(onOpenLayers).toHaveBeenCalledTimes(1);
  });
});

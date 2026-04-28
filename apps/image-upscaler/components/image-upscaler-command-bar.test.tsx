/* eslint-disable jsdoc/require-jsdoc */

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ImageUpscalerCommandBar } from "./image-upscaler-command-bar";

function renderCommandBar(
  overrides: Partial<Parameters<typeof ImageUpscalerCommandBar>[0]> = {}
): void {
  render(
    <ImageUpscalerCommandBar
      hasItems={false}
      hasOutput={false}
      isProcessing={false}
      runtime={null}
      sizeMode="scale"
      scale={2}
      targetMode="width"
      targetInput="2048"
      onAddImages={vi.fn()}
      onUpscale={vi.fn()}
      onDownloadAll={vi.fn()}
      onClearAll={vi.fn()}
      onSizeModeChange={vi.fn()}
      onScaleChange={vi.fn()}
      onTargetModeChange={vi.fn()}
      onTargetInputChange={vi.fn()}
      {...overrides}
    />
  );
}

describe("ImageUpscalerCommandBar", () => {
  it("keeps primary actions accessible when no items are queued", () => {
    renderCommandBar();

    expect(screen.getByRole("button", { name: "Add Images" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Upscale" })).toBeDisabled();
    expect(screen.getByText("Runtime: pending")).toBeInTheDocument();
  });

  it("wires add/upscale/download callbacks for actionable controls", () => {
    const onAddImages = vi.fn();
    const onUpscale = vi.fn();
    const onDownloadAll = vi.fn();

    renderCommandBar({
      hasItems: true,
      hasOutput: true,
      runtime: "webgpu",
      onAddImages,
      onUpscale,
      onDownloadAll,
    });

    fireEvent.click(screen.getByRole("button", { name: "Add More" }));
    fireEvent.click(screen.getByRole("button", { name: "Upscale" }));
    fireEvent.click(screen.getByRole("button", { name: "Download All" }));

    expect(onAddImages).toHaveBeenCalledTimes(1);
    expect(onUpscale).toHaveBeenCalledTimes(1);
    expect(onDownloadAll).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Runtime: webgpu")).toBeInTheDocument();
  });

  it("shows processing state labels and disables mutating actions while processing", () => {
    renderCommandBar({
      hasItems: true,
      hasOutput: true,
      isProcessing: true,
    });

    expect(
      screen.getByRole("button", { name: "Upscale (processing)" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add More" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download All" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear All" })).toBeDisabled();
  });

  it("opens settings and propagates mobile control changes", () => {
    const onSizeModeChange = vi.fn<(mode: "scale" | "target") => void>();
    const onScaleChange = vi.fn<(scale: 2 | 4) => void>();
    const onTargetModeChange = vi.fn<(mode: "width" | "height") => void>();
    const onTargetInputChange = vi.fn<(value: string) => void>();
    function StatefulHarness() {
      const [sizeMode, setSizeMode] = useState<"scale" | "target">("scale");
      const [scale, setScale] = useState<2 | 4>(2);
      const [targetMode, setTargetMode] = useState<"width" | "height">("width");
      const [targetInput, setTargetInput] = useState("2048");
      return (
        <ImageUpscalerCommandBar
          hasItems
          hasOutput={false}
          isProcessing={false}
          runtime={null}
          sizeMode={sizeMode}
          scale={scale}
          targetMode={targetMode}
          targetInput={targetInput}
          onAddImages={vi.fn()}
          onUpscale={vi.fn()}
          onDownloadAll={vi.fn()}
          onClearAll={vi.fn()}
          onSizeModeChange={(mode) => {
            setSizeMode(mode);
            onSizeModeChange(mode);
          }}
          onScaleChange={(nextScale) => {
            setScale(nextScale);
            onScaleChange(nextScale);
          }}
          onTargetModeChange={(mode) => {
            setTargetMode(mode);
            onTargetModeChange(mode);
          }}
          onTargetInputChange={(value) => {
            setTargetInput(value);
            onTargetInputChange(value);
          }}
        />
      );
    }
    render(<StatefulHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Upscale settings" }));
    fireEvent.change(screen.getByLabelText("Mode"), {
      target: { value: "target" },
    });
    fireEvent.change(screen.getByLabelText("Dimension"), {
      target: { value: "height" },
    });
    fireEvent.change(screen.getByLabelText("Target value"), {
      target: { value: "3000" },
    });

    expect(onSizeModeChange).toHaveBeenCalledWith("target");
    expect(onTargetModeChange).toHaveBeenCalledWith("height");
    expect(onTargetInputChange).toHaveBeenCalledWith("3000");

    fireEvent.change(screen.getByLabelText("Mode"), {
      target: { value: "scale" },
    });
    fireEvent.change(screen.getByLabelText("Scale"), {
      target: { value: "4" },
    });
    expect(onScaleChange).toHaveBeenCalledWith(4);
  });

  it("confirms clear-all action before invoking callback", () => {
    const onClearAll = vi.fn();
    renderCommandBar({ hasItems: true, onClearAll });

    fireEvent.click(screen.getByRole("button", { name: "Clear All" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear All" }));

    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});

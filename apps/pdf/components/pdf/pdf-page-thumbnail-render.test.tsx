import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cachePdfPageCanvas } from "@/lib/pdf-thumbnail-cache";

/** Minimal harness for the thumbnail capture lifecycle invariant. */
function ThumbnailCaptureHarness({
  finalCanvasSize,
}: {
  finalCanvasSize: { width: number; height: number };
}): React.JSX.Element {
  const canvasElementRef = React.useRef<HTMLCanvasElement | null>(null);
  const [imageBitmap, setImageBitmap] = React.useState<ImageBitmap | null>(
    null
  );

  const handleCanvasRef = React.useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasElementRef.current = canvas;
    },
    []
  );

  const captureRenderedCanvas = React.useCallback(async () => {
    const canvas = canvasElementRef.current;
    if (!canvas) {
      return;
    }

    const bitmap = await cachePdfPageCanvas(canvas, "thumbnail-key", {
      set: vi.fn(),
    });

    if (!bitmap || bitmap.width === 0 || bitmap.height === 0) {
      return;
    }

    setImageBitmap(bitmap);
  }, []);

  return (
    <div>
      {imageBitmap ? (
        <div data-testid="imagebitmap-thumbnail" />
      ) : (
        <canvas data-testid="pdf-page-fallback" ref={handleCanvasRef} />
      )}
      <button
        type="button"
        onClick={() => {
          const canvas = canvasElementRef.current;
          if (canvas) {
            canvas.width = finalCanvasSize.width;
            canvas.height = finalCanvasSize.height;
          }
          void captureRenderedCanvas();
        }}
      >
        finish-render
      </button>
    </div>
  );
}

describe("thumbnail canvas capture lifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not capture on canvas mount and only swaps after render completion", async () => {
    const bitmap = {
      width: 160,
      height: 220,
      close: vi.fn(),
    } as unknown as ImageBitmap;
    const createImageBitmap = vi.fn().mockResolvedValue(bitmap);
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    render(
      <ThumbnailCaptureHarness finalCanvasSize={{ width: 160, height: 220 }} />
    );

    expect(screen.getByTestId("pdf-page-fallback")).toBeInTheDocument();
    expect(
      screen.queryByTestId("imagebitmap-thumbnail")
    ).not.toBeInTheDocument();
    expect(createImageBitmap).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "finish-render" }));

    await waitFor(() => {
      expect(createImageBitmap).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByTestId("imagebitmap-thumbnail")).toBeInTheDocument();
    });
  });

  it("keeps the fallback canvas when render completion still yields an empty canvas", async () => {
    const createImageBitmap = vi.fn();
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    render(
      <ThumbnailCaptureHarness finalCanvasSize={{ width: 0, height: 0 }} />
    );

    expect(screen.getByTestId("pdf-page-fallback")).toBeInTheDocument();
    expect(
      screen.queryByTestId("imagebitmap-thumbnail")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "finish-render" }));

    await waitFor(() => {
      expect(screen.getByTestId("pdf-page-fallback")).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("imagebitmap-thumbnail")
    ).not.toBeInTheDocument();
    expect(createImageBitmap).not.toHaveBeenCalled();
  });
});

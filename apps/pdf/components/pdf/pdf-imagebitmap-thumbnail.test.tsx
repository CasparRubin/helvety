import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PdfImageBitmapThumbnail } from "./pdf-imagebitmap-thumbnail";

describe("PdfImageBitmapThumbnail", () => {
  const drawImage = vi.fn();
  const rotate = vi.fn();

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage,
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate,
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    drawImage.mockReset();
    rotate.mockReset();
  });

  it("draws an already-oriented bitmap 1:1 without canvas or CSS rotation", async () => {
    const imageBitmap = {
      width: 300,
      height: 200,
      close: vi.fn(),
    } as unknown as ImageBitmap;
    const onLoad = vi.fn();

    render(
      <PdfImageBitmapThumbnail
        imageBitmap={imageBitmap}
        pageNumber={1}
        onLoad={onLoad}
      />
    );

    const canvas = screen.getByLabelText("Page 1") as HTMLCanvasElement;

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledTimes(1);
    });

    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(200);
    expect(canvas.style.transform).toBe("");
    expect(drawImage).toHaveBeenCalledWith(imageBitmap, 0, 0);
    expect(rotate).not.toHaveBeenCalled();
  });
});

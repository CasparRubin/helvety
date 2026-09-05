/**
 * Component for rendering PDF pages from ImageBitmap.
 * Provides optimized rendering using ImageBitmap objects.
 *
 * Bitmaps are captured from an already-rotated react-pdf canvas, so this
 * component draws them 1:1 without applying additional rotation.
 */

import { cn } from "@helvety/shared/utils";
import * as React from "react";

/** Props for ImageBitmap-based PDF thumbnail (imageBitmap, pageNumber, callbacks). */
interface PdfImageBitmapThumbnailProps {
  /** ImageBitmap to render (already oriented) */
  imageBitmap: ImageBitmap;
  /** Page number for alt text */
  pageNumber: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image errors */
  onError?: () => void;
}

/**
 * Component for rendering ImageBitmap thumbnails.
 * Draws the bitmap at its native size; CSS object-contain handles layout.
 *
 * @param props - Component props
 * @returns Canvas element with ImageBitmap contents
 */
export function PdfImageBitmapThumbnail({
  imageBitmap,
  pageNumber,
  className,
  onLoad,
  onError,
}: PdfImageBitmapThumbnailProps): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Draw ImageBitmap to canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageBitmap) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageBitmap, 0, 0);

    setIsLoaded(true);
    onLoad?.();
  }, [imageBitmap, onLoad]);

  // Handle errors
  React.useEffect(() => {
    if (!imageBitmap) {
      onError?.();
    }
  }, [imageBitmap, onError]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Page ${pageNumber}`}
      className={cn("max-h-full max-w-full object-contain", className)}
      style={{
        width: "100%",
        height: "auto",
        maxWidth: "100%",
        maxHeight: "100%",
        opacity: isLoaded ? 1 : 0,
        transition: "opacity 0.2s ease-in-out",
      }}
    />
  );
}

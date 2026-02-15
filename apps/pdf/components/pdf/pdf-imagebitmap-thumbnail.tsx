/**
 * Component for rendering PDF pages from ImageBitmap.
 * Provides optimized rendering using ImageBitmap objects.
 */

import * as React from "react";

import { ROTATION_ANGLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Props for ImageBitmap-based PDF thumbnail (imageBitmap, pageNumber, rotation, callbacks). */
interface PdfImageBitmapThumbnailProps {
  /** ImageBitmap to render */
  imageBitmap: ImageBitmap;
  /** Page number for alt text */
  pageNumber: number;
  /** Rotation angle in degrees */
  rotation?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image errors */
  onError?: () => void;
}

/**
 * Component for rendering ImageBitmap thumbnails.
 * Handles rotation transformations efficiently.
 *
 * @param props - Component props
 * @returns Image element with ImageBitmap source
 */
export function PdfImageBitmapThumbnail({
  imageBitmap,
  pageNumber,
  rotation = 0,
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

    // Set canvas size
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply rotation if needed
    if (rotation !== 0) {
      ctx.save();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Draw ImageBitmap
    ctx.drawImage(imageBitmap, 0, 0);

    if (rotation !== 0) {
      ctx.restore();
    }

    setIsLoaded(true);
    onLoad?.();
  }, [imageBitmap, rotation, onLoad]);

  // Handle errors
  React.useEffect(() => {
    if (!imageBitmap) {
      onError?.();
    }
  }, [imageBitmap, onError]);

  // For 90/270 degree rotations, swap width/height to prevent clipping
  const needsDimensionSwap =
    rotation === ROTATION_ANGLES.QUARTER ||
    rotation === ROTATION_ANGLES.THREE_QUARTER;

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Page ${pageNumber}`}
      className={cn("max-h-full max-w-full object-contain", className)}
      style={{
        width: needsDimensionSwap ? "auto" : "100%",
        height: needsDimensionSwap ? "100%" : "auto",
        maxWidth: "100%",
        maxHeight: "100%",
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        opacity: isLoaded ? 1 : 0,
        transition: "opacity 0.2s ease-in-out",
      }}
    />
  );
}

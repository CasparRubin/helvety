"use client";

// React
import * as React from "react";

// Internal utilities
import { ROTATION_ANGLES } from "@/lib/constants";

/** Props for image-based PDF page thumbnail (fileUrl, pageNumber, rotation, callbacks). */
interface PdfImageThumbnailProps {
  readonly fileUrl: string;
  readonly pageNumber: number;
  readonly rotation?: number;
  readonly onLoad?: () => void;
  readonly onError?: () => void;
}

/**
 * Component for rendering image thumbnails from blob URLs.
 *
 * Handles rotation transformations and dimension swapping for 90/270 degree rotations
 * to prevent clipping. Uses native img element because we're rendering user-uploaded
 * images from blob URLs, not static Next.js Image assets.
 *
 * @param props - Component props
 * @returns Image element with rotation and dimension handling
 *
 * @example
 * ```typescript
 * <PdfImageThumbnail
 *   fileUrl={blobUrl}
 *   pageNumber={1}
 *   rotation={90}
 *   onLoad={() => setLoaded(true)}
 *   onError={() => setError(true)}
 * />
 * ```
 */
export function PdfImageThumbnail({
  fileUrl,
  pageNumber,
  rotation = 0,
  onLoad,
  onError,
}: PdfImageThumbnailProps): React.JSX.Element {
  const handleLoad = React.useCallback((): void => {
    onLoad?.();
  }, [onLoad]);

  const handleError = React.useCallback((): void => {
    onError?.();
  }, [onError]);

  // For 90/270 degree rotations, swap width/height to prevent clipping
  const needsDimensionSwap =
    rotation === ROTATION_ANGLES.QUARTER ||
    rotation === ROTATION_ANGLES.THREE_QUARTER;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fileUrl}
      alt={`Page ${pageNumber}`}
      className="max-h-full max-w-full object-contain"
      style={{
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        width: needsDimensionSwap ? "auto" : "100%",
        height: needsDimensionSwap ? "100%" : "auto",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

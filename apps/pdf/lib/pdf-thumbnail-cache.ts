/** Builds the LRU cache key for a rendered PDF page thumbnail. */
export function buildPdfThumbnailCacheKey(params: {
  fileUrl: string;
  pageNumber: number;
  pageWidth: number;
  devicePixelRatio: number;
  isHighQuality: boolean;
  rotation?: number;
}): string {
  const effectiveDpr = params.isHighQuality
    ? params.devicePixelRatio
    : params.devicePixelRatio * 0.75;
  return `${params.fileUrl}:${params.pageNumber}:${params.pageWidth}:${effectiveDpr}:${params.rotation ?? 0}`;
}

/** Stores a rendered page canvas in the global ImageBitmap cache when capture is valid. */
export async function cachePdfPageCanvas(
  canvas: HTMLCanvasElement,
  cacheKey: string,
  cache: { set: (key: string, bitmap: ImageBitmap) => void }
): Promise<ImageBitmap | null> {
  if (
    typeof createImageBitmap === "undefined" ||
    canvas.width === 0 ||
    canvas.height === 0
  ) {
    return null;
  }
  const bitmap = await createImageBitmap(canvas);
  cache.set(cacheKey, bitmap);
  return bitmap;
}

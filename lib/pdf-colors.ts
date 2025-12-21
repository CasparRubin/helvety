// Color palette for PDF file identification
// 10 distinct colors covering the full spectrum (36° spacing)
// First 10 files get unique colors, then the palette cycles
// Optimized for visibility in both light and dark modes
const PDF_COLOR_PALETTE = [
  "oklch(0.65 0.22 25)",    // 0: Red - close to #ff0000 primary
  "oklch(0.72 0.20 61)",    // 1: Orange - 36° from red
  "oklch(0.80 0.18 97)",    // 2: Yellow - 72° from red
  "oklch(0.75 0.19 133)",   // 3: Yellow-green - 108° from red
  "oklch(0.70 0.20 169)",   // 4: Green - 144° from red
  "oklch(0.72 0.19 205)",   // 5: Cyan - 180° from red
  "oklch(0.70 0.18 241)",   // 6: Blue - 216° from red
  "oklch(0.68 0.21 277)",   // 7: Purple - 252° from red
  "oklch(0.70 0.22 313)",   // 8: Magenta - 288° from red
  "oklch(0.74 0.19 349)",   // 9: Pink - 324° from red
]

/**
 * Get a color for a PDF file based on its index
 * Colors cycle through the palette
 */
export function getPdfColor(fileIndex: number): string {
  return PDF_COLOR_PALETTE[fileIndex % PDF_COLOR_PALETTE.length]
}

/**
 * Add alpha channel to an oklch color string
 * @param color - oklch color string (e.g., "oklch(0.65 0.22 25)")
 * @param alpha - Alpha value between 0 and 1 (default: 0.15)
 * @returns oklch color string with alpha channel (e.g., "oklch(0.65 0.22 25 / 0.15)")
 */
export function addOklchAlpha(color: string, alpha: number = 0.15): string {
  // oklch format: oklch(L C H) or oklch(L C H / alpha)
  // Remove existing alpha if present, then add new one
  const withoutAlpha = color.replace(/\s*\/\s*[\d.]+\)$/, ')')
  return `${withoutAlpha.replace(/\)$/, '')} / ${alpha})`
}


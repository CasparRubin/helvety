import { OCR_PAGE_SEPARATOR_TEMPLATE } from "./constants";

/** Collapses excessive whitespace and trims a single page's extracted text. */
export function normalizePageText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Renders the page separator header for a 1-based page index. */
function pageSeparator(page: number): string {
  return OCR_PAGE_SEPARATOR_TEMPLATE.replace("{page}", String(page));
}

/**
 * Combines per-page extracted text into a single document.
 *
 * A single page (typically an image) is returned as-is. Multi-page PDFs are
 * concatenated with clear `--- Page N ---` separators so page boundaries stay
 * readable in the downloaded `.txt` file.
 */
export function combinePageTexts(pageTexts: readonly string[]): string {
  const normalized = pageTexts.map(normalizePageText);

  if (normalized.length <= 1) {
    return normalized[0] ?? "";
  }

  return normalized
    .map((text, index) => `${pageSeparator(index + 1).trimStart()}${text}`)
    .join("\n")
    .trim();
}

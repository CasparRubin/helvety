import { OCR_TEXT_LAYER_MIN_CHARS } from "./constants";

/** Minimal shape of a pdf.js text item (from `getTextContent`). */
interface PdfTextItem {
  readonly str?: string;
  readonly hasEOL?: boolean;
}

/** Minimal shape of a pdf.js text content payload. */
interface PdfTextContent {
  readonly items: readonly (PdfTextItem | { readonly type?: string })[];
}

/** Minimal shape of the pdf.js page proxy needed for text extraction. */
export interface PdfTextLayerPage {
  getTextContent(): Promise<PdfTextContent>;
}

/** Narrows a pdf.js text-content entry to a text item carrying a string. */
function isTextItem(
  item: PdfTextItem | { readonly type?: string }
): item is PdfTextItem {
  return "str" in item && typeof item.str === "string";
}

/**
 * Extracts the embedded text layer of a born-digital PDF page. Marked text items
 * (which lack `str`) are ignored, and `hasEOL` items insert line breaks.
 */
export async function extractPageTextLayer(
  page: PdfTextLayerPage
): Promise<string> {
  const content = await page.getTextContent();
  let text = "";
  for (const item of content.items) {
    if (!isTextItem(item)) {
      continue;
    }
    text += item.str ?? "";
    if (item.hasEOL) {
      text += "\n";
    }
  }
  return text;
}

/**
 * Born-digital heuristic: a page whose normalized text-layer content is shorter
 * than the threshold is treated as image-only and should be routed through OCR.
 */
export function pageNeedsOcr(textLayer: string): boolean {
  return textLayer.replace(/\s+/g, "").length < OCR_TEXT_LAYER_MIN_CHARS;
}

import { degrees, PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import {
  computeEffectiveRotation,
  exportPageWithRotation,
} from "./pdf-rotation";

/** Creates a single-page PDF with optional /Rotate metadata for export tests. */
async function createSourcePdfWithRotation(
  rotation: number
): Promise<PDFDocument> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([200, 300]);
  if (rotation !== 0) {
    page.setRotation(degrees(rotation));
  }
  return pdf;
}

/** Exports one page and returns the output page's /Rotate angle. */
async function getExportedPageRotation(
  sourcePdf: PDFDocument,
  pageIndex: number,
  effectiveRotation: number,
  isImage: boolean
): Promise<number> {
  const outputPdf = await PDFDocument.create();
  await exportPageWithRotation(
    outputPdf,
    sourcePdf,
    pageIndex,
    effectiveRotation,
    isImage
  );
  return outputPdf.getPage(0).getRotation().angle;
}

describe("exportPageWithRotation", () => {
  it("preserves inherent 90° when user rotation is 0°", async () => {
    const source = await createSourcePdfWithRotation(90);
    const rotation = await getExportedPageRotation(source, 0, 90, false);
    expect(rotation).toBe(90);
  });

  it("clears inherent 90° when effective rotation is 0°", async () => {
    const source = await createSourcePdfWithRotation(90);
    const effective = computeEffectiveRotation(90, 270);
    expect(effective).toBe(0);

    const rotation = await getExportedPageRotation(source, 0, effective, false);
    expect(rotation).toBe(0);
  });

  it("applies user 90° on a page with no inherent rotation", async () => {
    const source = await createSourcePdfWithRotation(0);
    const rotation = await getExportedPageRotation(source, 0, 90, false);
    expect(rotation).toBe(90);
  });

  it("combines inherent and user rotation to 180°", async () => {
    const source = await createSourcePdfWithRotation(90);
    const effective = computeEffectiveRotation(90, 90);
    const rotation = await getExportedPageRotation(source, 0, effective, false);
    expect(rotation).toBe(180);
  });

  it("uses content transform for images at 90° with no /Rotate metadata", async () => {
    const source = await createSourcePdfWithRotation(0);
    const outputPdf = await PDFDocument.create();
    await exportPageWithRotation(outputPdf, source, 0, 90, true);

    const exportedPage = outputPdf.getPage(0);
    expect(exportedPage.getRotation().angle).toBe(0);
    const { width, height } = exportedPage.getSize();
    expect(width).toBe(300);
    expect(height).toBe(200);
  });

  it("uses metadata rotation for images at 180°", async () => {
    const source = await createSourcePdfWithRotation(0);
    const rotation = await getExportedPageRotation(source, 0, 180, true);
    expect(rotation).toBe(180);
  });

  it("keeps exported rotation at 0° when source and effective are upright", async () => {
    const source = await createSourcePdfWithRotation(0);
    const rotation = await getExportedPageRotation(source, 0, 0, false);
    expect(rotation).toBe(0);
  });

  it("exports multiple pages with independent effective rotations", async () => {
    const sourceA = await createSourcePdfWithRotation(90);
    const sourceB = await createSourcePdfWithRotation(0);
    const merged = await PDFDocument.create();

    await exportPageWithRotation(
      merged,
      sourceA,
      0,
      computeEffectiveRotation(90, 270),
      false
    );
    await exportPageWithRotation(merged, sourceB, 0, 90, false);

    expect(merged.getPageCount()).toBe(2);
    expect(merged.getPage(0).getRotation().angle).toBe(0);
    expect(merged.getPage(1).getRotation().angle).toBe(90);
  });
});

import { degrees, PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { getPageRotations } from "./pdf-loading";

describe("getPageRotations", () => {
  it("returns only non-zero page rotations with 1-based page numbers", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    const rotated = pdf.addPage();
    rotated.setRotation(degrees(90));
    pdf.addPage();
    const rotatedAgain = pdf.addPage();
    rotatedAgain.setRotation(degrees(270));

    expect(getPageRotations(pdf)).toEqual({
      2: 90,
      4: 270,
    });
  });

  it("returns an empty object when no pages are rotated", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    pdf.addPage();

    expect(getPageRotations(pdf)).toEqual({});
  });
});

import { degrees } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";

import {
  applyPageRotation,
  needsContentTransform,
  normalizeRotation,
} from "./pdf-rotation";

import type { PDFPage } from "pdf-lib";

describe("normalizeRotation", () => {
  it("normalizes arbitrary positive angles to 0/90/180/270", () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(89)).toBe(90);
    expect(normalizeRotation(91)).toBe(90);
    expect(normalizeRotation(450)).toBe(90);
  });

  it("normalizes negative angles", () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(-181)).toBe(180);
  });
});

describe("needsContentTransform", () => {
  it("returns true for quarter turns only", () => {
    expect(needsContentTransform(90)).toBe(true);
    expect(needsContentTransform(270)).toBe(true);
    expect(needsContentTransform(0)).toBe(false);
    expect(needsContentTransform(180)).toBe(false);
  });
});

describe("applyPageRotation", () => {
  it("is a no-op for zero rotation", async () => {
    const setRotation = vi.fn();
    await applyPageRotation({ setRotation } as unknown as PDFPage, 0, false);
    expect(setRotation).not.toHaveBeenCalled();
  });

  it("applies normalized rotation metadata", async () => {
    const setRotation = vi.fn();
    await applyPageRotation({ setRotation } as unknown as PDFPage, 450, false);
    expect(setRotation).toHaveBeenCalledWith(degrees(90));
  });

  it("throws for invalid target page", async () => {
    await expect(applyPageRotation({} as PDFPage, 90, false)).rejects.toThrow(
      "Invalid targetPage provided"
    );
  });
});

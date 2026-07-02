import { degrees } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";

import {
  applyPageRotation,
  computeEffectiveRotation,
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

describe("computeEffectiveRotation", () => {
  it("combines inherent and user rotation", () => {
    expect(computeEffectiveRotation(90, 0)).toBe(90);
    expect(computeEffectiveRotation(90, 90)).toBe(180);
    expect(computeEffectiveRotation(90, 270)).toBe(0);
    expect(computeEffectiveRotation(0, 90)).toBe(90);
  });
});

describe("applyPageRotation", () => {
  it("sets zero rotation to clear inherited /Rotate on copied pages", async () => {
    const setRotation = vi.fn();
    await applyPageRotation({ setRotation } as unknown as PDFPage, 0, false);
    expect(setRotation).toHaveBeenCalledWith(degrees(0));
  });

  it("applies normalized rotation metadata", async () => {
    const setRotation = vi.fn();
    await applyPageRotation({ setRotation } as unknown as PDFPage, 450, false);
    expect(setRotation).toHaveBeenCalledWith(degrees(90));
  });

  it("applies 180° metadata for images", async () => {
    const setRotation = vi.fn();
    await applyPageRotation({ setRotation } as unknown as PDFPage, 180, true);
    expect(setRotation).toHaveBeenCalledWith(degrees(180));
  });

  it("throws for invalid target page", async () => {
    await expect(applyPageRotation({} as PDFPage, 90, false)).rejects.toThrow(
      "Invalid targetPage provided"
    );
  });
});

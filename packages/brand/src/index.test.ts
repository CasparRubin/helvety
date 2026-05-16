import { describe, expect, it } from "vitest";

import { HELVETY_ACCENT_RED, HELVETY_ACCENT_RED_RGB } from "./colors";
import { HelvetyIdentifier } from "./identifier";
import { HelvetyLogo } from "./logo";
import { brandAssets } from "./urls";

import {
  HelvetyIdentifier as ExportedHelvetyIdentifier,
  HelvetyLogo as ExportedHelvetyLogo,
  HELVETY_ACCENT_RED as exportedAccentRed,
  HELVETY_ACCENT_RED_RGB as exportedAccentRedRgb,
  brandAssets as exportedBrandAssets,
} from "./index";

describe("brand package exports", () => {
  it("re-exports component and asset modules from index", () => {
    expect(ExportedHelvetyLogo).toBe(HelvetyLogo);
    expect(ExportedHelvetyIdentifier).toBe(HelvetyIdentifier);
    expect(exportedBrandAssets).toBe(brandAssets);
    expect(exportedAccentRed).toBe(HELVETY_ACCENT_RED);
    expect(exportedAccentRedRgb).toBe(HELVETY_ACCENT_RED_RGB);
  });

  it("defines the shared accent red for WebGL presets", () => {
    expect(HELVETY_ACCENT_RED).toBe("#ff102a");
    expect(HELVETY_ACCENT_RED_RGB).toBe(0xff102a);
  });
});

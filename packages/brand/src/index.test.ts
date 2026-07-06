import { describe, expect, it } from "vitest";

import { HELVETY_ACCENT_RED } from "./colors";
import { HelvetyIdentifier } from "./identifier";
import { HelvetyLogo } from "./logo";
import { brandAssets } from "./urls";

import {
  HelvetyIdentifier as ExportedHelvetyIdentifier,
  HelvetyLogo as ExportedHelvetyLogo,
  HELVETY_ACCENT_RED as exportedAccentRed,
  brandAssets as exportedBrandAssets,
} from "./index";

describe("brand package exports", () => {
  it("re-exports component and asset modules from index", () => {
    expect(ExportedHelvetyLogo).toBe(HelvetyLogo);
    expect(ExportedHelvetyIdentifier).toBe(HelvetyIdentifier);
    expect(exportedBrandAssets).toBe(brandAssets);
    expect(exportedAccentRed).toBe(HELVETY_ACCENT_RED);
  });

  it("defines the shared accent red", () => {
    expect(HELVETY_ACCENT_RED).toBe("#ff102a");
  });
});

import { describe, expect, it } from "vitest";

import { HelvetyIdentifier } from "./identifier";
import { HelvetyLogo } from "./logo";
import { brandAssets } from "./urls";

import {
  HelvetyIdentifier as ExportedHelvetyIdentifier,
  HelvetyLogo as ExportedHelvetyLogo,
  brandAssets as exportedBrandAssets,
} from "./index";

describe("brand package exports", () => {
  it("re-exports component and asset modules from index", () => {
    expect(ExportedHelvetyLogo).toBe(HelvetyLogo);
    expect(ExportedHelvetyIdentifier).toBe(HelvetyIdentifier);
    expect(exportedBrandAssets).toBe(brandAssets);
  });
});

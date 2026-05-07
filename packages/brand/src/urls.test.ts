import { urls } from "@helvety/shared/config";
import { describe, expect, it } from "vitest";

import { brandAssets } from "./urls";

describe("brandAssets", () => {
  it("exposes stable absolute URLs for metadata assets", () => {
    expect(brandAssets.identifierLogo).toBe(
      `${urls.home}/helvety_identifier.svg`
    );
  });
});

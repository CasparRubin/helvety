import { describe, expect, it } from "vitest";

import { THUMBNAIL_QUALITY } from "./constants";
import { calculateOptimalDPR } from "./thumbnail-dpr";

describe("calculateOptimalDPR", () => {
  it("uses screen-size baselines for desktop, tablet, and mobile", () => {
    expect(
      calculateOptimalDPR({
        screenSize: "desktop",
        containerWidth: 400,
        totalPages: 10,
      })
    ).toBe(THUMBNAIL_QUALITY.DESKTOP_DPR);

    expect(
      calculateOptimalDPR({
        screenSize: "tablet",
        containerWidth: 400,
        totalPages: 10,
      })
    ).toBe(THUMBNAIL_QUALITY.TABLET_DPR);

    expect(
      calculateOptimalDPR({
        screenSize: "mobile",
        containerWidth: 400,
        totalPages: 10,
      })
    ).toBe(THUMBNAIL_QUALITY.MOBILE_DPR);
  });

  it("reduces DPR for large documents and narrow containers", () => {
    const baseline = calculateOptimalDPR({
      screenSize: "desktop",
      containerWidth: 400,
      totalPages: 10,
    });
    const reduced = calculateOptimalDPR({
      screenSize: "desktop",
      containerWidth: 180,
      totalPages: 250,
    });

    expect(reduced).toBeLessThan(baseline);
  });

  it("clamps DPR between configured min and max", () => {
    const dpr = calculateOptimalDPR({
      screenSize: "mobile",
      containerWidth: 120,
      totalPages: 500,
    });

    expect(dpr).toBeGreaterThanOrEqual(THUMBNAIL_QUALITY.MIN_DPR);
    expect(dpr).toBeLessThanOrEqual(THUMBNAIL_QUALITY.MAX_DPR);
  });
});

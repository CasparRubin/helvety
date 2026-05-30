import { expectPrivateZoneRobots } from "@helvety/shared/test-utils/seo-route-test-helpers";
import { describe, it } from "vitest";

import robots from "./robots";

describe("links SEO routes", () => {
  it("returns noindex robots rules", () => {
    expectPrivateZoneRobots(robots());
  });
});

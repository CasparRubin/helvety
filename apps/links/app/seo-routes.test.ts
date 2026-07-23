import { expectPrivateZoneRobots } from "@helvety/shared/test-utils/seo-route-test-helpers";
import { describe, it } from "vitest";

import robots from "./robots";

describe("links SEO routes", () => {
  it("returns private robots output", () => {
    expectPrivateZoneRobots(robots(), "/links");
  });
});

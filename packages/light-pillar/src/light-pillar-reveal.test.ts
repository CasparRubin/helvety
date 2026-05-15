import { describe, expect, it } from "vitest";

import { LIGHT_PILLAR_REVEAL_TRANSITION_CLASS } from "./light-pillar-reveal";

describe("light-pillar reveal", () => {
  it("uses a 700ms ease-out opacity transition with reduced-motion override", () => {
    expect(LIGHT_PILLAR_REVEAL_TRANSITION_CLASS).toBe(
      "transition-opacity duration-700 ease-out motion-reduce:transition-none"
    );
  });
});

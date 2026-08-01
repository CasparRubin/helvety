import { HelvetyShellRouteLoading } from "@helvety/ui/helvety-shell-route-loading";
import { describe, expect, it } from "vitest";

import Loading from "./loading";

describe("Loading", () => {
  it("re-exports HelvetyShellRouteLoading", () => {
    expect(Loading).toBe(HelvetyShellRouteLoading);
  });
});

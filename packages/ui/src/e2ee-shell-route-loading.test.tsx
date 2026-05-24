import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { E2eeShellRouteLoading } from "./e2ee-shell-route-loading";

describe("E2eeShellRouteLoading", () => {
  it("fills the viewport with shell chrome skeletons and the shared spinner", () => {
    const html = renderToStaticMarkup(<E2eeShellRouteLoading />);
    expect(html).toContain("min-h-svh");
    expect(html).toContain("bg-background");
    expect(html).toContain("animate-pulse");
    expect(html).toContain("Loading...");
  });
});

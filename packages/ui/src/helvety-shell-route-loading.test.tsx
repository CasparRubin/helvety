import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HelvetyShellRouteLoading } from "./helvety-shell-route-loading";

describe("HelvetyShellRouteLoading", () => {
  it("fills the viewport with themed background and shows the shared spinner", () => {
    const html = renderToStaticMarkup(<HelvetyShellRouteLoading />);
    expect(html).toContain("min-h-svh");
    expect(html).toContain("bg-background");
    expect(html).toContain("flex-1");
    expect(html).toContain("Loading...");
  });
});

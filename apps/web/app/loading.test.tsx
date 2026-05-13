import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Loading from "./loading";

describe("Loading", () => {
  it("fills the viewport with themed background so route transitions do not flash white", () => {
    const html = renderToStaticMarkup(<Loading />);
    expect(html).toContain("min-h-svh");
    expect(html).toContain("bg-background");
    expect(html).toContain("flex-1");
  });
});

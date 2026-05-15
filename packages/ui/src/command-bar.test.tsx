import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CommandBar, CommandBarSpacer } from "./command-bar";

describe("CommandBar", () => {
  it("uses shrink-0 pinning classes instead of sticky positioning", () => {
    const html = renderToStaticMarkup(
      <CommandBar>
        <span data-testid="action">Action</span>
        <CommandBarSpacer />
        <span>End</span>
      </CommandBar>
    );

    expect(html).toContain('data-testid="action"');
    expect(html).toContain("shrink-0");
    expect(html).not.toContain("sticky");
    expect(html).not.toContain("top-0");
  });
});

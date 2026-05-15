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

  it("translucent variant uses lighter frosted toolbar than solid", () => {
    const solid = renderToStaticMarkup(
      <CommandBar variant="solid">
        <span>Nav</span>
      </CommandBar>
    );
    const translucent = renderToStaticMarkup(
      <CommandBar variant="translucent">
        <span>Nav</span>
      </CommandBar>
    );

    const solidClass = solid.match(/<nav class="([^"]+)"/)?.[1] ?? "";
    const translucentClass =
      translucent.match(/<nav class="([^"]+)"/)?.[1] ?? "";

    expect(solidClass).toContain("bg-surface-toolbar");
    expect(solidClass).not.toContain("bg-surface-toolbar/");
    expect(solidClass).not.toContain("backdrop-blur");

    expect(translucentClass).toContain("bg-surface-toolbar/65");
    expect(translucentClass).toContain(
      "supports-[backdrop-filter]:bg-surface-toolbar/40"
    );
    expect(translucentClass).toContain("backdrop-blur");
    expect(translucentClass).not.toMatch(/\bbg-surface-toolbar\b(?!\/)/);
  });
});

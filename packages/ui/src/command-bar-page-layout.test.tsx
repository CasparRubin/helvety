import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CommandBarPageLayout } from "./command-bar-page-layout";

describe("CommandBarPageLayout", () => {
  it("renders command bar before scroll area and children inside viewport", () => {
    const html = renderToStaticMarkup(
      <CommandBarPageLayout commandBar={<nav data-testid="bar">Bar</nav>}>
        <p data-testid="body">Body</p>
      </CommandBarPageLayout>
    );

    const barIndex = html.indexOf('data-testid="bar"');
    const scrollIndex = html.indexOf('data-slot="scroll-area"');
    const bodyIndex = html.indexOf('data-testid="body"');

    expect(barIndex).toBeGreaterThan(-1);
    expect(scrollIndex).toBeGreaterThan(-1);
    expect(bodyIndex).toBeGreaterThan(-1);
    expect(barIndex).toBeLessThan(scrollIndex);
    expect(scrollIndex).toBeLessThan(bodyIndex);
  });

  it("pins the command bar outside scroll with overflow-hidden shell classes", () => {
    const html = renderToStaticMarkup(
      <CommandBarPageLayout commandBar={<nav data-testid="bar">Bar</nav>}>
        <p>Body</p>
      </CommandBarPageLayout>
    );

    const barIndex = html.indexOf('data-testid="bar"');
    const scrollIndex = html.indexOf('data-slot="scroll-area"');
    const betweenBarAndScroll = html.slice(barIndex, scrollIndex);

    expect(html).toContain("overflow-hidden");
    expect(html).toContain("shrink-0");
    expect(betweenBarAndScroll).not.toContain('data-slot="scroll-area"');
    expect(betweenBarAndScroll).not.toContain("sticky");
  });

  it("applies flex viewport utilities via data-slot selector on ScrollArea root", () => {
    const html = renderToStaticMarkup(
      <CommandBarPageLayout commandBar={<nav>Bar</nav>}>
        <p>Body</p>
      </CommandBarPageLayout>
    );

    expect(html).toContain(
      "[&amp;&gt;[data-slot=scroll-area-viewport]]:max-h-full"
    );
    expect(html).toContain(
      "[&amp;&gt;[data-slot=scroll-area-viewport]]:min-h-0"
    );
    expect(html).toContain(
      "[&amp;&gt;[data-slot=scroll-area-viewport]]:flex-1"
    );
    expect(html).toContain('data-slot="scroll-area-viewport"');
  });
});

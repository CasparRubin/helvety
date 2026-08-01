import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  nextThemesProps: vi.fn(),
}));

vi.mock("next-themes", () => ({
  ThemeProvider: (props: {
    children: React.ReactNode;
    scriptProps?: { type?: string };
  }) => {
    mocks.nextThemesProps(props);
    return <>{props.children}</>;
  },
}));

import { ThemeProvider } from "./theme-provider";

describe("ThemeProvider", () => {
  it("marks the next-themes script as a data block on the client", () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <span>child</span>
      </ThemeProvider>
    );

    expect(mocks.nextThemesProps).toHaveBeenCalledWith(
      expect.objectContaining({
        scriptProps: expect.objectContaining({
          type: "application/json",
        }),
      })
    );
  });
});

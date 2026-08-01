import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(
  (): {
    setTheme: ReturnType<typeof vi.fn>;
    theme: string;
    resolvedTheme: string | undefined;
  } => ({
    setTheme: vi.fn(),
    theme: "system",
    resolvedTheme: "dark",
  })
);

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: mocks.setTheme,
    theme: mocks.theme,
    resolvedTheme: mocks.resolvedTheme,
  }),
}));

import { ThemeSwitcher } from "./theme-switcher";
import { TooltipProvider } from "./tooltip";

describe("ThemeSwitcher", () => {
  it("resolves system theme and toggles to the opposite explicit theme", () => {
    mocks.theme = "system";
    mocks.resolvedTheme = "dark";
    mocks.setTheme.mockClear();

    render(
      <TooltipProvider>
        <ThemeSwitcher />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(mocks.setTheme).toHaveBeenCalledWith("light");
  });

  it("toggles between light and dark when theme is explicit", () => {
    mocks.theme = "light";
    mocks.resolvedTheme = "light";
    mocks.setTheme.mockClear();

    render(
      <TooltipProvider>
        <ThemeSwitcher />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen, userEvent } from "@/__tests__/utils/test-utils";
import { ThemeSwitcher } from "@/components/theme-switcher";

// Mock next-themes with controllable state for testing different theme scenarios
// This overrides the global mock in vitest.setup.ts to allow per-test control
const mockSetTheme = vi.fn();
let mockTheme = "light";
let mockResolvedTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
    resolvedTheme: mockResolvedTheme,
    themes: ["light", "dark", "system"],
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockTheme = "light";
    mockResolvedTheme = "light";
  });

  it("should render the theme toggle button", () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it("should have accessible label", () => {
    render(<ThemeSwitcher />);
    expect(screen.getByLabelText(/toggle theme/i)).toBeInTheDocument();
  });

  it("should call setTheme when clicked in light mode", async () => {
    const user = userEvent.setup();
    mockTheme = "light";
    mockResolvedTheme = "light";

    render(<ThemeSwitcher />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    await user.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("should call setTheme when clicked in dark mode", async () => {
    const user = userEvent.setup();
    mockTheme = "dark";
    mockResolvedTheme = "dark";

    render(<ThemeSwitcher />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    await user.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("should toggle based on resolved theme when in system mode", async () => {
    const user = userEvent.setup();
    mockTheme = "system";
    mockResolvedTheme = "dark";

    render(<ThemeSwitcher />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    await user.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("should have screen reader text", () => {
    render(<ThemeSwitcher />);
    expect(screen.getByText("Toggle theme")).toBeInTheDocument();
  });
});

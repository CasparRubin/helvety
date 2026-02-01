import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock next-themes with controllable state
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
}));

// Wrapper with TooltipProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockTheme = "light";
    mockResolvedTheme = "light";
  });

  it("should render the theme toggle button", () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it("should have accessible label", () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });
    expect(screen.getByLabelText(/toggle theme/i)).toBeInTheDocument();
  });

  it("should call setTheme when clicked in light mode", async () => {
    const user = userEvent.setup();
    mockTheme = "light";
    mockResolvedTheme = "light";

    render(<ThemeSwitcher />, { wrapper: TestWrapper });
    const button = screen.getByRole("button", { name: /toggle theme/i });

    await user.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("should call setTheme when clicked in dark mode", async () => {
    const user = userEvent.setup();
    mockTheme = "dark";
    mockResolvedTheme = "dark";

    render(<ThemeSwitcher />, { wrapper: TestWrapper });
    const button = screen.getByRole("button", { name: /toggle theme/i });

    await user.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("should toggle based on resolved theme when in system mode", async () => {
    const user = userEvent.setup();
    mockTheme = "system";
    mockResolvedTheme = "dark";

    render(<ThemeSwitcher />, { wrapper: TestWrapper });
    const button = screen.getByRole("button", { name: /toggle theme/i });

    await user.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("should have screen reader text", () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });
    expect(screen.getByText("Toggle theme")).toBeInTheDocument();
  });
});

import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// =============================================================================
// NEXT.JS MOCKS (all projects)
// =============================================================================
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
    themes: ["light", "dark", "system"],
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// =============================================================================
// NOTE: This project (helvety.com) is a simple landing page and does not
// require WebAuthn or Crypto mocks. Add them here if needed in the future.
// =============================================================================

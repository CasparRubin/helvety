import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@helvety/shared/csp-nonce", () => ({
  getRequestCspNonce: vi.fn().mockResolvedValue("test-nonce"),
}));

vi.mock("@helvety/shared/fonts", () => ({
  publicSans: { variable: "mock-font-variable" },
}));

vi.mock("@helvety/shared/layout-session-bootstrap", () => ({
  bootstrapE2eeLayoutSession: vi.fn().mockResolvedValue({
    csrfToken: "csrf-test",
    initialUser: null,
  }),
}));

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: unknown }) => children,
  useTheme: () => ({
    resolvedTheme: "light",
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => null,
}));

vi.mock("./session-recovery", () => ({
  SessionRecovery: () => null,
}));

vi.mock("./auth-token-handler", () => ({
  AuthTokenHandler: () => null,
}));

vi.mock("./encryption-gate-app", () => ({
  EncryptionGateApp: ({ children }: { children: unknown }) => children,
}));

import { E2eeAppRootLayout } from "./e2ee-app-root-layout";

import type { ReactNode } from "react";

describe("E2eeAppRootLayout", () => {
  it("omits analytics mount when NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS is false", async () => {
    vi.stubEnv("NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS", "false");
    vi.resetModules();

    const { E2eeAppRootLayout: Layout } =
      await import("./e2ee-app-root-layout");

    const tree = await Layout({
      children: <p>Page</p>,
      organizationLogoUrl: "https://example.com/logo.png",
      softwareApplication: {
        name: "Helvety Tasks",
        url: "https://example.com/tasks",
        description: "Tasks",
        applicationCategory: "ProductivityApplication",
      },
      encryptionProvider: ({ children }: { children: ReactNode }) => (
        <>{children}</>
      ),
      renderNavbar: () => <nav>Nav</nav>,
    });

    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Page");
    expect(html).not.toContain('data-testid="vercel-analytics-stub"');

    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("renders overflow-hidden main without a layout-level ScrollArea", async () => {
    const tree = await E2eeAppRootLayout({
      children: <p data-testid="page">Dashboard</p>,
      organizationLogoUrl: "https://example.com/logo.png",
      softwareApplication: {
        name: "Helvety Tasks",
        url: "https://example.com/tasks",
        description: "Tasks",
        applicationCategory: "ProductivityApplication",
      },
      encryptionProvider: ({ children }: { children: ReactNode }) => (
        <>{children}</>
      ),
      renderNavbar: () => <nav data-testid="navbar">Nav</nav>,
    });

    const html = renderToStaticMarkup(tree);
    expect(html).toContain('data-testid="navbar"');
    expect(html).toContain('data-testid="page"');
    expect(html).toContain('id="main-content"');
    expect(html).toContain("overflow-hidden");
    expect(html).not.toContain('data-slot="scroll-area"');
  });
});

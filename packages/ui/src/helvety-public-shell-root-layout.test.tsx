import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@helvety/shared/csp-nonce", () => ({
  getRequestCspNonce: vi.fn().mockResolvedValue("test-nonce"),
}));

vi.mock("@helvety/shared/fonts", () => ({
  publicSans: { variable: "mock-font-variable" },
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

vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => null,
}));

vi.mock("./session-recovery", () => ({
  SessionRecovery: () => null,
}));

vi.mock("./auth-token-handler", () => ({
  AuthTokenHandler: () => null,
}));

import { HelvetyPublicShellRootLayout } from "./helvety-public-shell-root-layout";

describe("HelvetyPublicShellRootLayout", () => {
  it("renders overflow-main variant with navbar and main landmark", async () => {
    const tree = await HelvetyPublicShellRootLayout({
      children: <p>Body</p>,
      organizationLogoUrl: "https://example.com/logo.png",
      jsonLdGraphTail: [
        {
          "@type": "WebApplication",
          name: "Test App",
          url: "https://example.com/app",
          operatingSystem: "Any",
        },
      ],
      renderNavbar: <nav data-testid="navbar">Nav</nav>,
      mainVariant: "overflow-main",
    });

    const html = renderToStaticMarkup(tree);
    expect(html).toContain('data-testid="navbar"');
    expect(html).toContain('id="main-content"');
    expect(html).toContain("Body");
    expect(html).toContain("bg-background");
    expect(html).toContain("text-foreground");
  });

  it("renders scroll-area variant with main content", async () => {
    const tree = await HelvetyPublicShellRootLayout({
      children: <p>In scroll</p>,
      organizationLogoUrl: "https://example.com/logo.png",
      jsonLdGraphTail: [],
      renderNavbar: <div data-testid="nb">X</div>,
      mainVariant: "scroll-area",
      footerExternal: false,
    });

    const html = renderToStaticMarkup(tree);
    expect(html).toContain('data-testid="nb"');
    expect(html).toContain("In scroll");
    expect(html).toContain("bg-background");
    expect(html).toContain("text-foreground");
  });

  it("navbar-only scope passes auth+session+column+toaster into wrap and renders scroll prefix", async () => {
    const tree = await HelvetyPublicShellRootLayout({
      children: <p>Catalog</p>,
      organizationLogoUrl: "https://example.com/logo.png",
      jsonLdGraphTail: [],
      renderNavbar: <div data-testid="nb">Nav</div>,
      mainVariant: "scroll-area",
      themeProviderScope: "navbar-only",
      scrollAreaMainPrefix: <nav data-testid="store-subnav">Sub</nav>,
      wrapInsideTooltipProvider: (shell) => (
        <div data-testid="providers-mock">{shell}</div>
      ),
    });

    const html = renderToStaticMarkup(tree);
    expect(html).toContain('data-testid="providers-mock"');
    expect(html).toContain('data-testid="store-subnav"');
    expect(html).toContain("Catalog");
    expect(html).toContain("bg-background");
    expect(html).toContain("text-foreground");
  });
});

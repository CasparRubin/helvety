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

vi.mock("./session-recovery", () => ({
  SessionRecovery: () => null,
}));

vi.mock("./auth-token-handler", () => ({
  AuthTokenHandler: () => null,
}));

import { HelvetyPublicShellRootLayout } from "./helvety-public-shell-root-layout";
import {
  expectThemeScriptBeforeSkipLink,
  expectThemeScriptInHead,
} from "./helvety-theme-init-script.test-helpers";

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
    expect(html).toContain('nonce="test-nonce"');
    expect(html).toContain("localStorage.getItem");
    expectThemeScriptInHead(html);
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
    expect(html).toContain('nonce="test-nonce"');
    expect(html).toContain("localStorage.getItem");
    expectThemeScriptInHead(html);
    expectThemeScriptBeforeSkipLink(html);
  });

  it("scroll-area variant without prefix wraps only main content in ScrollArea", async () => {
    const tree = await HelvetyPublicShellRootLayout({
      children: <p data-testid="body">In scroll</p>,
      organizationLogoUrl: "https://example.com/logo.png",
      jsonLdGraphTail: [],
      renderNavbar: <div data-testid="nb">X</div>,
      mainVariant: "scroll-area",
    });

    const html = renderToStaticMarkup(tree);
    const scrollIndex = html.indexOf('data-slot="scroll-area"');
    const mainIndex = html.indexOf('id="main-content"');
    const bodyIndex = html.indexOf('data-testid="body"');

    expect(scrollIndex).toBeGreaterThan(-1);
    expect(mainIndex).toBeGreaterThan(scrollIndex);
    expect(bodyIndex).toBeGreaterThan(mainIndex);
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
    const subnavIndex = html.indexOf('data-testid="store-subnav"');
    const scrollIndex = html.indexOf('data-slot="scroll-area"');
    expect(subnavIndex).toBeGreaterThan(-1);
    expect(scrollIndex).toBeGreaterThan(-1);
    expect(subnavIndex).toBeLessThan(scrollIndex);
    const betweenSubnavAndScroll = html.slice(subnavIndex, scrollIndex);
    expect(betweenSubnavAndScroll).not.toContain("Catalog");
    expect(betweenSubnavAndScroll).not.toContain('id="main-content"');
    expect(html).toContain("Catalog");
    expect(html).toContain("bg-background");
    expect(html).toContain("text-foreground");
    expect(html).toContain("localStorage.getItem");
    expectThemeScriptInHead(html);
    expectThemeScriptBeforeSkipLink(html);
  });
});

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** App navbars must import About copy from `@helvety/shared/app-navbar-about`. */
const NAVBAR_WIRING = [
  {
    rel: "apps/web/components/navbar.tsx",
    symbol: "WEB_NAVBAR_ABOUT",
  },
  {
    rel: "apps/store/components/navbar.tsx",
    symbol: "STORE_NAVBAR_ABOUT",
  },
  {
    rel: "apps/auth/components/navbar.tsx",
    symbol: "AUTH_NAVBAR_ABOUT",
  },
  {
    rel: "apps/tasks/components/navbar.tsx",
    symbol: "TASKS_NAVBAR_ABOUT",
  },
  {
    rel: "apps/contacts/components/navbar.tsx",
    symbol: "CONTACTS_NAVBAR_ABOUT",
  },
  {
    rel: "apps/notes/components/navbar.tsx",
    symbol: "NOTES_NAVBAR_ABOUT",
  },
  {
    rel: "apps/links/components/navbar.tsx",
    symbol: "LINKS_NAVBAR_ABOUT",
  },
  {
    rel: "apps/pdf/components/navbar.tsx",
    symbol: "pdfNavbarAbout",
  },
  {
    rel: "apps/docs/components/navbar.tsx",
    symbol: "docsNavbarAbout",
  },
  {
    rel: "apps/image-upscaler/components/navbar.tsx",
    symbol: "imageUpscalerNavbarAbout",
  },
] as const;

describe("app navbar wiring", () => {
  it.each(NAVBAR_WIRING)(
    "$rel imports shared navbar About copy ($symbol)",
    ({ rel, symbol }) => {
      const source = readFileSync(join(repoRoot, rel), "utf8");
      expect(source).toContain("@helvety/shared/app-navbar-about");
      expect(source).toContain(symbol);
      expect(source).not.toMatch(/aboutDescription\s*=\s*["'`][^"'`]{40,}/);
    }
  );

  it("E2EE app navbars use shared encryption tooltip body", () => {
    for (const rel of [
      "apps/tasks/components/navbar.tsx",
      "apps/contacts/components/navbar.tsx",
      "apps/notes/components/navbar.tsx",
      "apps/links/components/navbar.tsx",
    ] as const) {
      const source = readFileSync(join(repoRoot, rel), "utf8");
      expect(source).toContain("E2EE_NAVBAR_ENCRYPTION_TOOLTIP");
      expect(source).toContain("E2eeAppNavbar");
    }
  });

  it("auth navbar uses shared encryption tooltip copy", () => {
    const source = readFileSync(
      join(repoRoot, "apps/auth/components/navbar.tsx"),
      "utf8"
    );
    expect(source).toContain("AUTH_NAVBAR_ENCRYPTION_TOOLTIP");
    expect(source).toContain('loginReturnUrl="current"');
  });
});

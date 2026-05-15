import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

describe("store root layout shell backdrop", () => {
  it("imports StoreShellWithBackdrop and wraps shell inside CSRFProvider", () => {
    const src = readFileSync(layoutPath, "utf8");
    expect(src).toContain(
      'import { StoreShellWithBackdrop } from "@/components/store-shell-with-backdrop"'
    );
    expect(src).toContain(
      "<StoreShellWithBackdrop>{shell}</StoreShellWithBackdrop>"
    );
    expect(src).toContain("<CSRFProvider csrfToken={csrfToken}>");
    expect(src).toContain("wrapInsideTooltipProvider");
  });
});

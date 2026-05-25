import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const PUBLIC_SHELL_APPS = [
  "web",
  "auth",
  "store",
  "pdf",
  "docs",
  "image-upscaler",
] as const;

const E2EE_SHELL_APPS = ["tasks", "contacts", "notes", "links"] as const;

/** Reads an app root layout source for structural wiring assertions. */
function readLayout(app: string): string {
  return readFileSync(join(repoRoot, "apps", app, "app/layout.tsx"), "utf8");
}

describe("zone root layout wiring", () => {
  it.each(PUBLIC_SHELL_APPS)(
    "apps/%s uses JSX HelvetyPublicShellRootLayout",
    (app) => {
      const src = readLayout(app);
      expect(src).toContain("<HelvetyPublicShellRootLayout");
      expect(src).not.toMatch(/return\s+HelvetyPublicShellRootLayout\s*\(/);
    }
  );

  it.each(E2EE_SHELL_APPS)(
    "apps/%s uses async RootLayout with E2eeAppRootLayout",
    (app) => {
      const src = readLayout(app);
      expect(src).toMatch(/export default async function RootLayout/);
      expect(src).toContain("<E2eeAppRootLayout");
      expect(src).toContain("encryptionProvider={EncryptionProvider}");
      expect(src).toContain('from "@/lib/crypto"');
    }
  );

  it.each(["auth", "docs"] as const)(
    "apps/%s imports EncryptionProvider via @/lib/crypto re-export",
    (app) => {
      const src = readLayout(app);
      expect(src).toContain('from "@/lib/crypto"');
      expect(src).toContain("EncryptionProvider");
    }
  );
});

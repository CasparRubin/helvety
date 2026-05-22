import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  CUSTOMER_COPY_EM_DASH,
  CUSTOMER_COPY_LLMS_RELATIVE_PATHS,
  CUSTOMER_COPY_README_RELATIVE_PATHS,
} from "./customer-copy-guardrails";
import {
  HELVETY_LLMS_LICENSING_NOTE,
  HELVETY_SOURCE_LICENSE_MARKETING,
} from "./licensing";
import {
  POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY,
  POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX,
  POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION,
} from "./power-platform-configurator-copy";
import { STORE_PRODUCT_CARDS } from "./store-catalog";
import { assertLicenseFreeSeoCopy } from "./test-utils/customer-copy-test-helpers";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Vitest helper: fails when `text` contains an em-dash. */
function assertNoEmDash(label: string, text: string): void {
  expect(text, `${label} must not contain an em-dash`).not.toContain(
    CUSTOMER_COPY_EM_DASH
  );
}

describe("store copy guardrails", () => {
  it("catalog card blurbs contain no em-dashes", () => {
    for (const card of STORE_PRODUCT_CARDS) {
      assertNoEmDash(`store-catalog ${card.id}`, card.shortDescription);
    }
  });

  it("Power Platform Configurator shared copy contains no em-dashes", () => {
    for (const [label, text] of [
      ["PUBLIC_SUMMARY", POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY],
      ["STORE_CARD_SUFFIX", POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX],
      [
        "STORE_SHORT_DESCRIPTION",
        POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION,
      ],
    ] as const) {
      assertNoEmDash(label, text);
    }
  });

  it("llms.txt crawler summaries contain no em-dashes", () => {
    for (const rel of CUSTOMER_COPY_LLMS_RELATIVE_PATHS) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      assertNoEmDash(rel, text);
    }
  });

  it("app README intros contain no em-dashes", () => {
    for (const rel of CUSTOMER_COPY_README_RELATIVE_PATHS) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      assertNoEmDash(rel, text);
    }
  });

  it("every llms.txt documents AGPL licensing for products with published source", () => {
    for (const rel of CUSTOMER_COPY_LLMS_RELATIVE_PATHS) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      expect(text, rel).toContain("## Licensing");
      expect(text, rel).toContain(HELVETY_LLMS_LICENSING_NOTE);
      expect(text, rel).toMatch(/AGPL-3\.0/);
    }
  });

  it("llms.txt taglines avoid license wording (licensing lives under ## Licensing)", () => {
    for (const rel of CUSTOMER_COPY_LLMS_RELATIVE_PATHS) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      const tagline = text.match(/^> (.+)$/m)?.[1] ?? "";
      assertLicenseFreeSeoCopy(`${rel} tagline`, tagline);
    }
  });

  it("app README intros avoid AGPL marketing outside the License section", () => {
    const appReadmes = CUSTOMER_COPY_README_RELATIVE_PATHS.filter((rel) =>
      rel.startsWith("apps/")
    );
    for (const rel of appReadmes) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      const intro = text.split(/^## License\b/m)[0] ?? text;
      expect(intro, rel).not.toContain(HELVETY_SOURCE_LICENSE_MARKETING);
      expect(intro, rel).not.toMatch(/All published Helvety source/i);
    }
  });
});

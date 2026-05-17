import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { HELVETY_LLMS_LICENSING_NOTE } from "./licensing";
import { POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION } from "./power-automate-editor-enforcer-copy";
import {
  PRODUCT_RELEASE_TIE_PRIORITY,
  STORE_PRODUCT_CARDS,
  compareStoreCatalogEntriesNewestFirst,
  findStoreProductCardBySlug,
  getStoreCatalogNewestFirst,
  requireStoreProductCard,
} from "./store-catalog";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("store-catalog", () => {
  it("keeps catalog metadata self-consistent (ids unique; tie map matches cards)", () => {
    const ids = STORE_PRODUCT_CARDS.map((c) => c.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);

    const cardIds = new Set<string>(ids);
    const tieIds = new Set(Object.keys(PRODUCT_RELEASE_TIE_PRIORITY));
    expect(tieIds.size).toBe(cardIds.size);
    for (const id of cardIds) {
      expect(tieIds.has(id)).toBe(true);
    }
    for (const id of tieIds) {
      expect(cardIds.has(id)).toBe(true);
    }
  });

  it("sorts newest release first with expected endpoints", () => {
    const sorted = getStoreCatalogNewestFirst();
    expect(sorted[0]?.id).toBe("helvety-links");
    expect(sorted[sorted.length - 1]?.id).toBe("helvety-pdf");
  });

  it("finds cards by public slug", () => {
    expect(findStoreProductCardBySlug("helvety-links")?.id).toBe(
      "helvety-links"
    );
    expect(findStoreProductCardBySlug("not-a-product")).toBeUndefined();
  });

  it("includes a non-empty runs-on label on every card", () => {
    for (const card of STORE_PRODUCT_CARDS) {
      expect(card.runsOn.trim().length).toBeGreaterThan(0);
    }
  });

  it("declares free and AGPL open-source flags on every current card", () => {
    for (const card of STORE_PRODUCT_CARDS) {
      expect(card.isFree).toBe(true);
      expect(card.isOpenSource).toBe(true);
    }
  });

  it("orders ties by PRODUCT_RELEASE_TIE_PRIORITY", () => {
    const a = { id: "helvety-pdf", releaseDate: "2025-09-14" };
    const b = { id: "helvety-spo-explorer", releaseDate: "2025-10-05" };
    expect(compareStoreCatalogEntriesNewestFirst(a, b)).toBeGreaterThan(0);
    expect(compareStoreCatalogEntriesNewestFirst(b, a)).toBeLessThan(0);
  });

  it("includes Helvety Links in the catalog with SaaS metadata", () => {
    const card = requireStoreProductCard("helvety-links");
    expect(card.name).toBe("Helvety Links");
    expect(card.runsOn).toBe("Browser");
    expect(card.releaseDate).toBe("2026-05-16");
    expect(card.shortDescription).toMatch(/before storage/i);
    expect(card.shortDescription).not.toMatch(/before they sync/i);
  });

  it("store llms.txt lists the Helvety Links product page", () => {
    const text = readFileSync(
      join(repoRoot, "apps/store/public/llms.txt"),
      "utf8"
    );
    expect(text).toContain("https://helvety.com/store/products/helvety-links");
  });

  it("Power Automate card and llms.txt use canonical store short description", () => {
    const card = requireStoreProductCard(
      "helvety-power-automate-editor-version-enforcer"
    );
    expect(card.name).toBe("Power Automate Editor Version Enforcer");
    expect(card.shortDescription).toBe(
      POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION
    );

    for (const rel of [
      "apps/store/public/llms.txt",
      "apps/web/public/llms.txt",
    ] as const) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      expect(text).toContain(
        POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION
      );
      expect(text).toContain("## Licensing");
      expect(text).toContain(HELVETY_LLMS_LICENSING_NOTE);
    }
  });
});

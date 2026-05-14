import {
  POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY,
  POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION,
} from "@helvety/shared/power-automate-editor-enforcer-copy";
import {
  STORE_PRODUCT_CARDS,
  requireStoreProductCard,
} from "@helvety/shared/store-catalog";
import { describe, expect, it } from "vitest";

import { isSoftwareProduct } from "../types/products";

import { getAllProducts, getProductBySlug } from "./products";

describe("store product catalog", () => {
  it("includes one store listing per shared catalog card", () => {
    expect(getAllProducts()).toHaveLength(STORE_PRODUCT_CARDS.length);
  });

  it("card-level fields match shared store-catalog for every product", () => {
    for (const product of getAllProducts()) {
      const card = requireStoreProductCard(product.id);
      expect(product.slug).toBe(card.slug);
      expect(product.name).toBe(card.name);
      expect(product.shortDescription).toBe(card.shortDescription);
      expect(product.type).toBe(card.type);
      expect(product.category).toBe(card.category);
      expect(product.metadata?.releaseDate).toBe(card.releaseDate);
    }
  });

  it("shared catalog ids match store listing count", () => {
    expect(new Set(getAllProducts().map((p) => p.id))).toEqual(
      new Set(STORE_PRODUCT_CARDS.map((c) => c.id))
    );
  });

  it("default sort is newest release first (Image Upscaler last shipped)", () => {
    const ids = getAllProducts().map((p) => p.id);
    expect(ids[0]).toBe("helvety-image-upscaler");
    expect(ids[ids.length - 1]).toBe("helvety-pdf");
  });

  it("resolves known product slugs", () => {
    expect(
      getProductBySlug("helvety-power-automate-editor-preference")?.name
    ).toBe("Power Automate Editor Version Enforcer");
    expect(getProductBySlug("helvety-spo-explorer")?.slug).toBe(
      "helvety-spo-explorer"
    );
    expect(getProductBySlug("helvety-pdf")?.slug).toBe("helvety-pdf");
    expect(getProductBySlug("helvety-screen-tools")?.slug).toBe(
      "helvety-screen-tools"
    );
    expect(getProductBySlug("helvety-image-upscaler")?.slug).toBe(
      "helvety-image-upscaler"
    );
  });

  it("stores structured About copy for every product", () => {
    for (const product of getAllProducts()) {
      expect(product.description.intro.trim().length).toBeGreaterThan(0);
      for (const section of product.description.sections ?? []) {
        expect(section.heading.trim().length).toBeGreaterThan(0);
        if (section.kind === "paragraph") {
          expect(section.body.trim().length).toBeGreaterThan(0);
        } else {
          expect(section.items.length).toBeGreaterThan(0);
          for (const item of section.items) {
            expect(item.trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("avoids stale download-button instructions for software without package download CTA", () => {
    const stalePhrase = "Download button on this page";
    for (const product of getAllProducts()) {
      if (!isSoftwareProduct(product)) continue;
      const hasPackageDownloadCta = Boolean(product.software.publicPackageId);
      if (hasPackageDownloadCta) continue;

      expect(product.description.intro).not.toContain(stalePhrase);
      for (const section of product.description.sections ?? []) {
        if (section.kind === "paragraph") {
          expect(section.body).not.toContain(stalePhrase);
        } else {
          for (const item of section.items) {
            expect(item).not.toContain(stalePhrase);
          }
        }
      }
      for (const step of product.software.installationSteps ?? []) {
        expect(step.description).not.toContain(stalePhrase);
      }
    }
  });

  it("Power Automate product copy matches extension Survey tab semantics (regression)", () => {
    const product = getProductBySlug(
      "helvety-power-automate-editor-preference"
    );
    expect(product).toBeDefined();
    if (!product) {
      return;
    }

    expect(product.name).toBe("Power Automate Editor Version Enforcer");
    expect(isSoftwareProduct(product)).toBe(true);
    if (!isSoftwareProduct(product)) {
      return;
    }

    expect(product.shortDescription).toBe(
      POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION
    );
    expect(
      product.description.intro.startsWith(
        POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY
      )
    ).toBe(true);

    const sectionText = (product.description.sections ?? []).flatMap((s) =>
      s.kind === "paragraph" ? [s.body] : s.items
    );
    const combined = [
      product.shortDescription,
      product.description.intro,
      ...sectionText,
      ...product.features,
      ...(product.software?.installationSteps ?? []).map(
        (st) => st.description
      ),
      ...(product.metadata?.keywords ?? []),
    ].join("\n");

    expect(combined).toContain("Survey tab");
    expect(combined).toContain("Microsoft survey prompt");
    expect(combined).not.toContain("Feedback tab");
    expect(combined).not.toContain("Ignore v3survey");
    expect(combined).not.toContain("Enforce v3survey=true");
    expect(combined).toContain("Hide");
    expect(combined).toContain("Show");
    expect(product.metadata?.keywords).toContain("survey");
    expect(product.metadata?.keywords).not.toContain("feedback");
  });

  it("Power Automate store listing points GitHub link at canonical extension repo", () => {
    const product = getProductBySlug(
      "helvety-power-automate-editor-preference"
    );
    expect(product?.links?.github).toBe(
      "https://github.com/CasparRubin/power-automate-editor-version-enforcer"
    );
  });
});

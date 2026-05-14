import {
  STORE_PRODUCT_CARDS,
  requireStoreProductCard,
} from "@helvety/shared/store-catalog";
import { describe, expect, it } from "vitest";

import { isSoftwareProduct } from "../types/products";

import { getAllProducts, getProductBySlug } from "./products";

describe("store product catalog", () => {
  it("includes all eight listings", () => {
    expect(getAllProducts()).toHaveLength(8);
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
    ).toBe("Power Automate: editor preference");
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
});

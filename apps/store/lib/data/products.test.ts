import {
  CUSTOMER_COPY_EM_DASH,
  CUSTOMER_COPY_CARD_ABOUT_PREFIX_OVERLAP_MAX,
} from "@helvety/shared/customer-copy-guardrails";
import {
  HELVETY_FREE_AGPL_FEATURE,
  HELVETY_FREE_AGPL_INLINE,
} from "@helvety/shared/licensing";
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

import { productArtwork } from "./product-artwork";
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

  it("default sort is newest release first (Links newest; PDF oldest)", () => {
    const ids = getAllProducts().map((p) => p.id);
    expect(ids[0]).toBe("helvety-links");
    expect(ids[ids.length - 1]).toBe("helvety-pdf");
  });

  it("resolves known product slugs", () => {
    expect(
      getProductBySlug("helvety-power-automate-editor-version-enforcer")?.name
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
    expect(getProductBySlug("helvety-links")?.name).toBe("Helvety Links");
    expect(getProductBySlug("helvety-links")?.links?.website).toBe(
      "https://helvety.com/links"
    );
  });

  it("every listing has store artwork and an artist credit", () => {
    for (const product of getAllProducts()) {
      expect(product.image, product.id).toBeDefined();
      expect(product.artist?.trim().length, product.id).toBeGreaterThan(0);
    }
  });

  it("assigns each artwork asset to exactly one product", () => {
    const images = getAllProducts().map((product) => product.image);
    expect(new Set(images).size).toBe(images.length);
  });

  it("Helvety Links is a SaaS listing with store artwork and monorepo source", () => {
    const product = getProductBySlug("helvety-links");
    expect(product).toBeDefined();
    if (!product) {
      return;
    }
    expect(product.type).toBe("saas");
    expect(product.image).toBe(productArtwork.artwork9);
    expect(product.artist).toBe("Anny Meisser Vonzun");
    expect(product.links?.github).toContain("apps/links");
    expect(product.description.intro).toMatch(/before storage/i);
    expect(product.description.intro).not.toMatch(/before they sync/i);
    expect(product.features).toContain(
      "End-to-end encryption for bookmark names and URLs"
    );
    expect(product.features).toContain("Drag-and-drop reorder and reparenting");
    expect(product.features).not.toContain(
      "Drag and drop reorder within a folder"
    );
    expect(product.features).not.toContain(
      "Reorder links and folders within the same parent folder"
    );
    const organization = product.description.sections?.find(
      (section) => section.heading === "Organization"
    );
    expect(organization?.kind).toBe("bullets");
    if (organization?.kind === "bullets") {
      expect(organization.items[0]).toContain("All folder as the library root");
      expect(organization.items.join(" ")).toMatch(/2,000/);
      expect(organization.items.join(" ")).toMatch(/drag-and-drop/i);
      expect(organization.items.join(" ")).toMatch(
        /open every link in a folder/i
      );
    }
    expect(product.description.intro).not.toMatch(/Unlimited nested/i);
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

  it("keeps catalog card blurbs separate from About intros", () => {
    for (const product of getAllProducts()) {
      const hero = product.shortDescription.trim();
      const about = product.description.intro.trim();
      expect(about).not.toBe(hero);
      const overlap = hero.slice(
        0,
        CUSTOMER_COPY_CARD_ABOUT_PREFIX_OVERLAP_MAX
      );
      expect(
        about.startsWith(overlap),
        `About intro for ${product.id} must not repeat the card opening`
      ).toBe(false);
    }
  });

  it("store customer copy contains no em-dashes", () => {
    for (const product of getAllProducts()) {
      const strings: string[] = [
        product.shortDescription,
        product.description.intro,
        ...product.features,
        ...(product.metadata?.keywords ?? []),
      ];
      for (const section of product.description.sections ?? []) {
        if (section.kind === "paragraph") {
          strings.push(section.body);
        } else {
          strings.push(...section.items);
        }
      }
      if (isSoftwareProduct(product)) {
        for (const step of product.software.installationSteps ?? []) {
          strings.push(step.title, step.description);
        }
      }
      for (const text of strings) {
        expect(text, `em-dash in ${product.id}`).not.toContain(
          CUSTOMER_COPY_EM_DASH
        );
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

  it("Power Automate listing uses canonical store card copy", () => {
    const product = getProductBySlug(
      "helvety-power-automate-editor-version-enforcer"
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
    expect(product.description.intro).not.toContain(
      POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY
    );
  });

  it("Power Automate store listing points GitHub link at canonical extension repo", () => {
    const product = getProductBySlug(
      "helvety-power-automate-editor-version-enforcer"
    );
    expect(product?.links?.github).toBe(
      "https://github.com/CasparRubin/power-automate-editor-version-enforcer"
    );
  });

  it("open-source software listings use shared AGPL feature constants", () => {
    for (const slug of [
      "helvety-spo-explorer",
      "helvety-power-automate-editor-version-enforcer",
      "helvety-screen-tools",
    ] as const) {
      const product = getProductBySlug(slug);
      expect(product, slug).toBeDefined();
      if (!product) continue;

      const blob = [
        product.description.intro,
        ...product.features,
        ...(product.description.sections ?? []).flatMap((s) =>
          s.kind === "paragraph" ? [s.body] : s.items
        ),
      ].join("\n");

      expect(blob, slug).toContain("AGPL-3.0");
    }

    const spoSectionBodies = (
      getProductBySlug("helvety-spo-explorer")?.description.sections ?? []
    )
      .filter((s) => s.kind === "paragraph")
      .map((s) => s.body);
    expect(spoSectionBodies.join("\n")).toContain(HELVETY_FREE_AGPL_INLINE);
    expect(
      getProductBySlug("helvety-power-automate-editor-version-enforcer")
        ?.features
    ).toContain(HELVETY_FREE_AGPL_FEATURE);
    expect(getProductBySlug("helvety-screen-tools")?.features).toContain(
      HELVETY_FREE_AGPL_FEATURE
    );
  });

  it("Power Automate publicPackageId matches downloadable package config key", () => {
    const product = getProductBySlug(
      "helvety-power-automate-editor-version-enforcer"
    );
    expect(product).toBeDefined();
    if (!product || !isSoftwareProduct(product)) {
      throw new Error("Expected Power Automate software product");
    }
    expect(product.software.publicPackageId).toBe(
      "power-automate-editor-version-enforcer"
    );
  });
});

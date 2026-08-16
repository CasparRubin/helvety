import {
  CUSTOMER_COPY_EM_DASH,
  CUSTOMER_COPY_CARD_ABOUT_PREFIX_OVERLAP_MAX,
} from "@helvety/shared/customer-copy-guardrails";
import { ecosystemCategoryForStoreSlug } from "@helvety/shared/helvety-ecosystem-sections";
import {
  HELVETY_FREE_SOURCE_FEATURE,
  HELVETY_FREE_SOURCE_INLINE,
} from "@helvety/shared/licensing";
import {
  POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL,
  POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY,
  POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION,
} from "@helvety/shared/power-platform-configurator-copy";
import { RETIRED_HELVETY_EXTENSION_NAME_PATTERNS } from "@helvety/shared/retired-power-platform-extension-naming";
import {
  STORE_PRODUCT_CARDS,
  requireStoreProductCard,
} from "@helvety/shared/store-catalog";
import { describe, expect, it } from "vitest";

import { isSaaSProduct, isSoftwareProduct } from "../types/products";

import { productArtwork } from "./product-artwork";
import {
  getAllProducts,
  getFilteredProducts,
  getProductBySlug,
} from "./products";

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

  it("assigns ecosystem categories from the shared registry on every listing", () => {
    for (const product of getAllProducts()) {
      expect(product.category).toBe(
        ecosystemCategoryForStoreSlug(product.slug)
      );
    }

    const counts = getAllProducts().reduce<Record<string, number>>(
      (acc, product) => {
        acc[product.category] = (acc[product.category] ?? 0) + 1;
        return acc;
      },
      {}
    );

    expect(counts).toEqual({
      "encryption-apps": 1,
      "file-tools": 3,
      "browser-extensions": 1,
      "sharepoint-apps": 1,
      "desktop-apps": 2,
    });
  });

  it("shared catalog ids match store listing count", () => {
    expect(new Set(getAllProducts().map((p) => p.id))).toEqual(
      new Set(STORE_PRODUCT_CARDS.map((c) => c.id))
    );
  });

  it("default sort is newest release first (Power Platform Tools newest; PDF oldest)", () => {
    const ids = getAllProducts().map((p) => p.id);
    expect(ids[0]).toBe("helvety-power-platform-tools");
    expect(ids[ids.length - 1]).toBe("helvety-pdf");
  });

  it("getFilteredProducts returns catalog-sorted listings filtered by category only", () => {
    const all = getAllProducts();
    expect(getFilteredProducts({ category: "all" })).toEqual(all);
    expect(getFilteredProducts({})).toEqual(all);

    const fileTools = getFilteredProducts({ category: "file-tools" });
    expect(
      fileTools.every((product) => product.category === "file-tools")
    ).toBe(true);
    expect(fileTools.length).toBeGreaterThan(0);

    const fileToolIds = fileTools.map((product) => product.id);
    expect(fileToolIds).toEqual(
      all
        .filter((product) => product.category === "file-tools")
        .map((p) => p.id)
    );
  });

  it("derives metadata.platforms from shared catalog runsOn", () => {
    expect(
      getProductBySlug("helvety-spo-explorer")?.metadata?.platforms
    ).toEqual(["SharePoint Online", "Microsoft 365"]);
    expect(
      getProductBySlug("helvety-power-platform-configurator")?.metadata
        ?.platforms
    ).toEqual(["Microsoft Edge", "Google Chrome"]);
    expect(
      getProductBySlug("helvety-screen-tools")?.metadata?.platforms
    ).toEqual(["Windows"]);
    expect(
      getProductBySlug("helvety-power-platform-tools")?.metadata?.platforms
    ).toEqual(["Windows"]);
    expect(getProductBySlug("helvety-pdf")?.metadata?.platforms).toEqual([
      "Web",
    ]);
  });

  it("resolves known product slugs", () => {
    expect(getProductBySlug("helvety-power-platform-configurator")?.name).toBe(
      "Power Platform Configurator"
    );
    expect(getProductBySlug("helvety-spo-explorer")?.slug).toBe(
      "helvety-spo-explorer"
    );
    expect(getProductBySlug("helvety-pdf")?.slug).toBe("helvety-pdf");
    expect(getProductBySlug("helvety-screen-tools")?.slug).toBe(
      "helvety-screen-tools"
    );
    expect(getProductBySlug("helvety-power-platform-tools")?.name).toBe(
      "Helvety Power Platform Tools"
    );
    expect(
      getProductBySlug("helvety-power-platform-tools")?.links?.github
    ).toBe("https://github.com/CasparRubin/helvety-power-platform-tools");
    expect(getProductBySlug("helvety-image-editor")?.slug).toBe(
      "helvety-image-editor"
    );
    expect(getProductBySlug("helvety-ocr")?.name).toBe("Helvety OCR");
    expect(getProductBySlug("helvety-ocr")?.links?.website).toBe(
      "https://helvety.com/ocr"
    );
    expect(getProductBySlug("helvety-cloud")?.name).toBe("Helvety Cloud");
    expect(getProductBySlug("helvety-cloud")?.links?.website).toBe(
      "https://helvety.cloud"
    );
    expect(getProductBySlug("helvety-cloud")?.links?.github).toBe(
      "https://github.com/CasparRubin/helvety-cloud"
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
    expect(Object.keys(productArtwork)).toHaveLength(getAllProducts().length);
  });

  it("assigns canonical store artwork and artist per product", () => {
    const expected: Record<
      string,
      { artwork: keyof typeof productArtwork; artist: string }
    > = {
      "helvety-cloud": {
        artwork: "artwork3",
        artist: "Alexandre Calame",
      },
      "helvety-spo-explorer": {
        artwork: "artwork1",
        artist: "Alexandre Calame",
      },
      "helvety-power-platform-configurator": {
        artwork: "artwork6",
        artist: "Rudolf Koller",
      },
      "helvety-pdf": { artwork: "artwork7", artist: "Alexandre Calame" },
      "helvety-screen-tools": {
        artwork: "artwork8",
        artist: "Ferdinand Hodler",
      },
      "helvety-image-editor": {
        artwork: "artwork11",
        artist: "Clara von Rappard",
      },
      "helvety-ocr": {
        artwork: "artwork13",
        artist: "Anny Meisser Vonzun",
      },
      "helvety-power-platform-tools": {
        artwork: "artwork2",
        artist: "Alexandre Calame",
      },
    };

    expect(Object.keys(expected)).toHaveLength(getAllProducts().length);

    for (const [slug, { artwork, artist }] of Object.entries(expected)) {
      const product = getProductBySlug(slug);
      expect(product, slug).toBeDefined();
      if (!product) {
        continue;
      }
      expect(product.image, slug).toBe(productArtwork[artwork]);
      expect(product.artist, slug).toBe(artist);
    }
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

  it("store product copy does not use retired Power Automate extension product names", () => {
    const violations: string[] = [];
    for (const product of getAllProducts()) {
      const blob = [
        product.name,
        product.shortDescription,
        product.description.intro,
        ...product.features,
        ...(product.metadata?.keywords ?? []),
        ...(product.description.sections ?? []).flatMap((section) =>
          section.kind === "paragraph" ? [section.body] : section.items
        ),
        ...(isSoftwareProduct(product)
          ? (product.software.installationSteps ?? []).flatMap((step) => [
              step.title,
              step.description,
            ])
          : []),
      ].join("\n");

      for (const { label, re } of RETIRED_HELVETY_EXTENSION_NAME_PATTERNS) {
        if (re.test(blob)) {
          violations.push(`${product.id}: ${label}`);
        }
      }
    }
    expect(violations).toEqual([]);
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

  it("Helvety OCR uses Anny Meisser Vonzun artwork", () => {
    const product = getProductBySlug("helvety-ocr");
    expect(product).toBeDefined();
    if (!product) {
      return;
    }

    expect(product.image).toBe(productArtwork.artwork13);
    expect(product.artist).toBe("Anny Meisser Vonzun");
  });

  it("Helvety Cloud points at helvety.cloud with Calame artwork", () => {
    const product = getProductBySlug("helvety-cloud");
    expect(product).toBeDefined();
    if (!product) {
      return;
    }

    expect(product.category).toBe("encryption-apps");
    expect(product.image).toBe(productArtwork.artwork3);
    expect(product.artist).toBe("Alexandre Calame");
    expect(isSaaSProduct(product)).toBe(true);
    if (!isSaaSProduct(product)) {
      return;
    }
    expect(product.saas.appUrl).toBe("https://helvety.cloud");
    expect(product.pricing.hasFreeTier).toBe(true);
    expect(product.pricing.tiers.some((tier) => tier.interval === "year")).toBe(
      true
    );
    const proTier = product.pricing.tiers.find(
      (tier) => tier.id === "helvety-cloud-pro"
    );
    expect(proTier?.price).toBe(49900);
    expect(proTier?.currency).toBe("CHF");
  });

  it("Power Platform Configurator listing uses canonical store card copy", () => {
    const product = getProductBySlug("helvety-power-platform-configurator");
    expect(product).toBeDefined();
    if (!product) {
      return;
    }

    expect(product.name).toBe("Power Platform Configurator");
    expect(isSoftwareProduct(product)).toBe(true);
    if (!isSoftwareProduct(product)) {
      return;
    }

    expect(product.shortDescription).toBe(
      POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION
    );
    expect(product.description.intro).not.toContain(
      POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY
    );
    const listingCopy = [
      product.description.intro,
      ...product.features,
      ...(product.description.sections ?? []).flatMap((section) =>
        section.kind === "paragraph" ? [section.body] : section.items
      ),
      ...(product.software.installationSteps ?? []).flatMap((step) => [
        step.title,
        step.description,
      ]),
    ].join("\n");
    expect(listingCopy).toContain("Power Apps");
    expect(listingCopy).toContain("model-driven record form");
    expect(listingCopy).not.toMatch(/\b(Editor|Survey) tab\b/i);
  });

  it("Power Platform Configurator store listing points GitHub link at canonical extension repo", () => {
    const product = getProductBySlug("helvety-power-platform-configurator");
    expect(product?.links?.github).toBe(
      "https://github.com/CasparRubin/power-platform-configurator-browser-extension-chromium"
    );
  });

  it("open-source software listings use shared published-source wording (Store About copy)", () => {
    for (const slug of [
      "helvety-spo-explorer",
      "helvety-power-platform-configurator",
      "helvety-screen-tools",
      "helvety-power-platform-tools",
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

      expect(blob, slug).toContain("published source on GitHub");
      expect(blob, slug).toMatch(/LICENSE/i);
    }

    const spoSectionBodies = (
      getProductBySlug("helvety-spo-explorer")?.description.sections ?? []
    )
      .filter((s) => s.kind === "paragraph")
      .map((s) => s.body);
    expect(spoSectionBodies.join("\n")).toContain(HELVETY_FREE_SOURCE_INLINE);
    expect(
      getProductBySlug("helvety-power-platform-configurator")?.features
    ).toContain(HELVETY_FREE_SOURCE_FEATURE);
    expect(getProductBySlug("helvety-screen-tools")?.features).toContain(
      HELVETY_FREE_SOURCE_FEATURE
    );
    expect(
      getProductBySlug("helvety-power-platform-tools")?.features
    ).toContain(HELVETY_FREE_SOURCE_FEATURE);
  });

  it("Power Platform Configurator links to the Chrome Web Store and has no package download", () => {
    const product = getProductBySlug("helvety-power-platform-configurator");
    expect(product).toBeDefined();
    if (!product || !isSoftwareProduct(product)) {
      throw new Error("Expected Power Platform Configurator software product");
    }
    expect(product.links?.chromeWebStore).toBe(
      POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL
    );
    expect(product.software.publicPackageId).toBeUndefined();
    expect(product.software.fileFormat).toBeUndefined();
  });

  it("Power Platform Configurator installation copy describes Chrome Web Store install", () => {
    const product = getProductBySlug("helvety-power-platform-configurator");
    if (!product || !isSoftwareProduct(product)) {
      throw new Error("Expected Power Platform Configurator software product");
    }

    const steps = product.software.installationSteps ?? [];
    expect(steps.length).toBeGreaterThan(0);

    const blob = [
      product.description.intro,
      ...(product.description.sections ?? [])
        .filter((s) => s.kind === "paragraph")
        .map((s) => s.body),
      ...steps.flatMap((step) => [step.title, step.description]),
    ].join("\n");

    expect(blob).toMatch(/Chrome Web Store/i);
    expect(blob).toMatch(/Add to Chrome/i);
    expect(blob).toMatch(/edge:\/\/extensions/i);
    expect(blob).toMatch(/Allow extensions from other stores/i);
  });

  it("Power Platform Configurator copy does not describe sideload or ZIP install", () => {
    const product = getProductBySlug("helvety-power-platform-configurator");
    expect(product).toBeDefined();
    if (!product || !isSoftwareProduct(product)) {
      throw new Error("Expected Power Platform Configurator software product");
    }

    const blob = [
      product.description.intro,
      ...product.features,
      ...(product.description.sections ?? []).flatMap((s) =>
        s.kind === "paragraph" ? [s.body] : s.items
      ),
      ...(product.software.installationSteps ?? []).flatMap((step) => [
        step.title,
        step.description,
      ]),
      ...(product.software.requirements ?? []),
    ].join("\n");

    const forbidden = [
      "developer mode",
      "Load unpacked",
      "power-platform-configurator.zip",
      "Download button on this page",
      "chrome://extensions",
      "Enable Developer mode",
    ];
    for (const phrase of forbidden) {
      expect(blob, `must not contain "${phrase}"`).not.toMatch(
        new RegExp(phrase, "i")
      );
    }
  });

  it("Helvety Power Platform Tools serves a core zip and Flow Explorer module", () => {
    const product = getProductBySlug("helvety-power-platform-tools");
    expect(product).toBeDefined();
    if (!product || !isSoftwareProduct(product)) {
      throw new Error("Expected Helvety Power Platform Tools software product");
    }

    expect(product.software.publicPackageId).toBe("power-platform-tools");
    expect(product.software.fileFormat).toBe("zip");
    expect(product.software.modules).toEqual([
      {
        id: "flow-explorer",
        name: "Flow Explorer",
        description:
          "See what a cloud flow touches, and which flows use a Dataverse table.",
        publicPackageId: "flow-explorer",
        fileFormat: "zip",
      },
    ]);
  });
});

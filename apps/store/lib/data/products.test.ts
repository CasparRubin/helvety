import {
  CUSTOMER_COPY_EM_DASH,
  CUSTOMER_COPY_CARD_ABOUT_PREFIX_OVERLAP_MAX,
} from "@helvety/shared/customer-copy-guardrails";
import {
  HELVETY_FREE_AGPL_FEATURE,
  HELVETY_FREE_AGPL_INLINE,
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

import { isSoftwareProduct } from "../types/products";

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

  it("shared catalog ids match store listing count", () => {
    expect(new Set(getAllProducts().map((p) => p.id))).toEqual(
      new Set(STORE_PRODUCT_CARDS.map((c) => c.id))
    );
  });

  it("default sort is newest release first (Browser Extension newest; PDF oldest)", () => {
    const ids = getAllProducts().map((p) => p.id);
    expect(ids[0]).toBe("helvety-browser-extension");
    expect(ids[ids.length - 1]).toBe("helvety-pdf");
  });

  it("getFilteredProducts returns catalog-sorted listings filtered by type only", () => {
    const all = getAllProducts();
    expect(getFilteredProducts({ type: "all" })).toEqual(all);
    expect(getFilteredProducts({})).toEqual(all);

    const software = getFilteredProducts({ type: "software" });
    expect(software.every((product) => product.type === "software")).toBe(true);
    expect(software.length).toBeGreaterThan(0);

    const saas = getFilteredProducts({ type: "saas" });
    expect(saas.every((product) => product.type === "saas")).toBe(true);
    expect(saas.length).toBeGreaterThan(0);

    const softwareIds = software.map((product) => product.id);
    expect(softwareIds).toEqual(
      all.filter((product) => product.type === "software").map((p) => p.id)
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
  });

  it("Power Platform Configurator store listing points GitHub link at canonical extension repo", () => {
    const product = getProductBySlug("helvety-power-platform-configurator");
    expect(product?.links?.github).toBe(
      "https://github.com/CasparRubin/power-platform-configurator-browser-extension-chromium"
    );
  });

  it("open-source software listings use shared AGPL feature constants (Store About copy)", () => {
    for (const slug of [
      "helvety-spo-explorer",
      "helvety-power-platform-configurator",
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
      getProductBySlug("helvety-power-platform-configurator")?.features
    ).toContain(HELVETY_FREE_AGPL_FEATURE);
    expect(getProductBySlug("helvety-screen-tools")?.features).toContain(
      HELVETY_FREE_AGPL_FEATURE
    );
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
});

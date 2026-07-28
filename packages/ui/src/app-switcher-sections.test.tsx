import { urls } from "@helvety/shared/config";
import {
  allEcosystemStoreProductSlugs,
  ecosystemItemHref,
  HELVETY_ECOSYSTEM_PRODUCT_SECTIONS,
} from "@helvety/shared/helvety-ecosystem-sections";
import { describe, expect, it } from "vitest";

import {
  appSwitcherSections,
  ECOSYSTEM_SWITCHER_STORE_PRODUCT_SLUGS,
} from "./app-switcher-sections";

describe("app-switcher-sections", () => {
  it("deep-links Core Apps Store to the catalog landing page", () => {
    const coreApps = appSwitcherSections.find(
      (section) => section.title === "Core Apps"
    );
    const storeLink = coreApps?.links.find((link) => link.name === "Store");
    expect(storeLink?.href).toBe(urls.storeProducts);
  });

  it("links Core Apps Cloud to helvety.cloud", () => {
    const coreApps = appSwitcherSections.find(
      (section) => section.title === "Core Apps"
    );
    const cloudLink = coreApps?.links.find((link) => link.name === "Cloud");
    expect(cloudLink?.href).toBe(urls.cloud);
    expect(cloudLink?.href).toBe("https://helvety.cloud");
  });

  it("covers every ecosystem store product slug with an icon", () => {
    expect(new Set(ECOSYSTEM_SWITCHER_STORE_PRODUCT_SLUGS)).toEqual(
      new Set(allEcosystemStoreProductSlugs())
    );
  });

  it("renders product section titles from the shared ecosystem registry", () => {
    const productSections = appSwitcherSections.filter(
      (section) => section.title !== "Core Apps"
    );
    expect(productSections.map((section) => section.title)).toEqual(
      HELVETY_ECOSYSTEM_PRODUCT_SECTIONS.map((section) => section.title)
    );
  });

  it("builds link names and hrefs from the shared ecosystem registry", () => {
    const productSections = appSwitcherSections.filter(
      (section) => section.title !== "Core Apps"
    );

    for (const [index, section] of productSections.entries()) {
      const registrySection = HELVETY_ECOSYSTEM_PRODUCT_SECTIONS[index]!;
      expect(section.title).toBe(registrySection.title);
      expect(section.links).toHaveLength(registrySection.items.length);

      for (const [linkIndex, link] of section.links.entries()) {
        const item = registrySection.items[linkIndex]!;
        expect(link.name).toBe(item.displayName);
        expect(link.href).toBe(ecosystemItemHref(item));
      }
    }
  });
});

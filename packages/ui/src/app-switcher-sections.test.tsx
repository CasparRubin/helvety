import { urls } from "@helvety/shared/config";
import {
  allAppSwitcherEcosystemStoreProductSlugs,
  ecosystemItemHref,
  ecosystemSectionsForAppSwitcher,
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

  it("does not duplicate Helvety Cloud under Encryption Apps", () => {
    const encryptionApps = appSwitcherSections.find(
      (section) => section.title === "Encryption Apps"
    );
    expect(encryptionApps).toBeUndefined();
  });

  it("covers every switcher-visible ecosystem store product slug with an icon", () => {
    expect(new Set(ECOSYSTEM_SWITCHER_STORE_PRODUCT_SLUGS)).toEqual(
      new Set(allAppSwitcherEcosystemStoreProductSlugs())
    );
  });

  it("renders product section titles from switcher-visible ecosystem sections", () => {
    const productSections = appSwitcherSections.filter(
      (section) => section.title !== "Core Apps"
    );
    expect(productSections.map((section) => section.title)).toEqual(
      ecosystemSectionsForAppSwitcher().map((section) => section.title)
    );
  });

  it("builds link names and hrefs from switcher-visible ecosystem sections", () => {
    const productSections = appSwitcherSections.filter(
      (section) => section.title !== "Core Apps"
    );
    const registrySections = ecosystemSectionsForAppSwitcher();

    for (const [index, section] of productSections.entries()) {
      const registrySection = registrySections[index]!;
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

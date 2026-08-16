/**
 * App switcher navigation sections for {@link AppSwitcher}.
 * Product sections derive from `@helvety/shared/helvety-ecosystem-sections`; Core Apps
 * (Home, Cloud, Store) and per-product Lucide icons stay in this UI module.
 */

import { urls } from "@helvety/shared/config";
import {
  ecosystemItemHref,
  ecosystemSectionsForAppSwitcher,
  type HelvetyEcosystemItem,
  type HelvetyEcosystemSection,
} from "@helvety/shared/helvety-ecosystem-sections";
import {
  Building2,
  Cloud,
  FileText,
  House,
  ImagePlus,
  Monitor,
  Puzzle,
  ScanText,
  Store,
  Workflow,
} from "lucide-react";

import type { ComponentType, SVGProps } from "react";

/** Link item inside an app switcher section (shared with tests). */
export interface AppSwitcherSectionLink {
  name: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** Group of links under one heading in the app switcher. */
export interface AppSwitcherSection {
  title: string;
  links: AppSwitcherSectionLink[];
}

/** Icons keyed by store product slug (React components stay in the UI package). */
const ecosystemItemIcons: Record<
  string,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  "helvety-pdf": FileText,
  "helvety-image-editor": ImagePlus,
  "helvety-ocr": ScanText,
  "helvety-power-platform-configurator": Puzzle,
  "helvety-spo-explorer": Building2,
  "helvety-screen-tools": Monitor,
  "helvety-power-platform-tools": Workflow,
};

/** Maps a shared ecosystem section to app-switcher links with Lucide icons. */
function ecosystemSectionToSwitcherSection(
  section: HelvetyEcosystemSection
): AppSwitcherSection {
  return {
    title: section.title,
    links: section.items.map((item: HelvetyEcosystemItem) => {
      const icon = ecosystemItemIcons[item.storeProductSlug];
      if (!icon) {
        throw new Error(
          `Missing app-switcher icon for store product slug: ${item.storeProductSlug}`
        );
      }
      return {
        name: item.displayName,
        href: ecosystemItemHref(item),
        icon,
      };
    }),
  };
}

/**
 * Canonical navigation data for {@link AppSwitcher}. Product sections derive from
 * `@helvety/shared/helvety-ecosystem-sections`; Core Apps stay UI-local.
 * Core Apps **Store** uses {@link urls.storeProducts} so navigation skips the
 * store-root redirect to `/store/products`.
 * Core Apps **Cloud** links to {@link urls.cloud} (`https://helvety.cloud`).
 */
export const appSwitcherSections: AppSwitcherSection[] = [
  {
    title: "Core Apps",
    links: [
      { name: "Home", href: urls.home, icon: House },
      { name: "Cloud", href: urls.cloud, icon: Cloud },
      { name: "Store", href: urls.storeProducts, icon: Store },
    ],
  },
  ...ecosystemSectionsForAppSwitcher().map(ecosystemSectionToSwitcherSection),
];

/** Store product slugs that require an icon in {@link ecosystemItemIcons}. */
export const ECOSYSTEM_SWITCHER_STORE_PRODUCT_SLUGS =
  Object.keys(ecosystemItemIcons);

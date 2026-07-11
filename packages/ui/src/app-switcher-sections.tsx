/**
 * App switcher navigation sections for {@link AppSwitcher}.
 * Product sections derive from `@helvety/shared/helvety-ecosystem-sections`; Core Apps
 * (Home, Store) and per-product Lucide icons stay in this UI module.
 */

import { urls } from "@helvety/shared/config";
import {
  ecosystemItemHref,
  HELVETY_ECOSYSTEM_PRODUCT_SECTIONS,
  type HelvetyEcosystemItem,
  type HelvetyEcosystemSection,
} from "@helvety/shared/helvety-ecosystem-sections";
import {
  Building2,
  FileText,
  House,
  ImagePlus,
  ImageUp,
  ListTodo,
  Monitor,
  Link2,
  NotebookPen,
  PanelRight,
  Puzzle,
  ScanText,
  Store,
  Users,
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
  "helvety-tasks": ListTodo,
  "helvety-contacts": Users,
  "helvety-notes": NotebookPen,
  "helvety-links": Link2,
  "helvety-pdf": FileText,
  "helvety-image-upscaler": ImageUp,
  "helvety-image-editor": ImagePlus,
  "helvety-ocr": ScanText,
  "helvety-browser-extension": PanelRight,
  "helvety-power-platform-configurator": Puzzle,
  "helvety-spo-explorer": Building2,
  "helvety-screen-tools": Monitor,
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
 */
export const appSwitcherSections: AppSwitcherSection[] = [
  {
    title: "Core Apps",
    links: [
      { name: "Home", href: urls.home, icon: House },
      { name: "Store", href: urls.store, icon: Store },
    ],
  },
  ...HELVETY_ECOSYSTEM_PRODUCT_SECTIONS.map(ecosystemSectionToSwitcherSection),
];

/** Store product slugs that require an icon in {@link ecosystemItemIcons}. */
export const ECOSYSTEM_SWITCHER_STORE_PRODUCT_SLUGS =
  Object.keys(ecosystemItemIcons);

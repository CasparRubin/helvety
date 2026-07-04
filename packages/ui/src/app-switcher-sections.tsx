import { urls } from "@helvety/shared/config";
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

/**
 * Canonical navigation data for {@link AppSwitcher}. Kept in a non–client-boundary module
 * so Vitest can import the same structure the component renders (no duplicated expectations).
 */
export const appSwitcherSections: AppSwitcherSection[] = [
  {
    title: "Core Apps",
    links: [
      { name: "Home", href: urls.home, icon: House },
      { name: "Store", href: urls.store, icon: Store },
    ],
  },
  {
    title: "Encryption Apps",
    links: [
      { name: "Tasks", href: urls.tasks, icon: ListTodo },
      { name: "Contacts", href: urls.contacts, icon: Users },
      { name: "Notes", href: urls.notes, icon: NotebookPen },
      { name: "Links", href: urls.links, icon: Link2 },
    ],
  },
  {
    title: "File Tools",
    links: [
      { name: "PDF", href: urls.pdf, icon: FileText },
      { name: "Image Upscaler", href: urls.imageUpscaler, icon: ImageUp },
      { name: "Image Editor", href: urls.imageEditor, icon: ImagePlus },
    ],
  },
  {
    title: "Browser Extensions",
    links: [
      {
        name: "Helvety Browser Extension",
        href: `${urls.store}/products/helvety-browser-extension`,
        icon: PanelRight,
      },
      {
        name: "Power Platform Configurator",
        href: `${urls.store}/products/helvety-power-platform-configurator`,
        icon: Puzzle,
      },
    ],
  },
  {
    title: "SharePoint Apps",
    links: [
      {
        name: "Helvety SPO Explorer",
        href: `${urls.store}/products/helvety-spo-explorer`,
        icon: Building2,
      },
    ],
  },
  {
    title: "Desktop Apps",
    links: [
      {
        name: "Helvety Screen Tools",
        href: `${urls.store}/products/helvety-screen-tools`,
        icon: Monitor,
      },
    ],
  },
];

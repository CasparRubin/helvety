/**
 * Static product data for the Store app (@helvety/store)
 */

import {
  HELVETY_FREE_SOURCE_FEATURE,
  HELVETY_FREE_SOURCE_INLINE,
} from "@helvety/shared/licensing";
import { POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL } from "@helvety/shared/power-platform-configurator-copy";
import {
  getStoreCatalogNewestFirst,
  requireStoreProductCard,
  type StoreProductType,
} from "@helvety/shared/store-catalog";

import { catalogArtwork } from "@/lib/data/catalog-card-artwork";
import {
  type Product,
  type ProductFilters,
  type SaaSProduct,
  type SoftwareProduct,
} from "@/lib/types/products";

/**
 * Card-level fields (name, blurbs, release date, type, category) from
 * `@helvety/shared/store-catalog` (`category` is derived from
 * `@helvety/shared/helvety-ecosystem-sections`), narrowed to the literal `type`
 * the caller
 * declares (e.g. `"saas"` or `"software"`). Throws if the catalog declares a
 * different `type` for `id`, so {@link StoreProductCard.type} cannot drift
 * away from the Store-side `Product` discriminant.
 */
function cardCore<T extends StoreProductType>(id: string, expectedType: T) {
  const c = requireStoreProductCard(id);
  if (c.type !== expectedType) {
    throw new Error(
      `Store product "${id}" is declared as "${c.type}" in @helvety/shared/store-catalog, expected "${expectedType}".`
    );
  }
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    shortDescription: c.shortDescription,
    type: expectedType,
    category: c.category,
    releaseDate: c.releaseDate,
    runsOn: c.runsOn,
  };
}

/** Maps catalog `runsOn` labels to Store `metadata.platforms` entries. */
function platformsFromRunsOn(runsOn: string): string[] {
  switch (runsOn) {
    case "SharePoint Online":
      return ["SharePoint Online", "Microsoft 365"];
    case "Edge & Chrome":
      return ["Microsoft Edge", "Google Chrome"];
    case "Windows 10 & 11":
      return ["Windows"];
    default:
      return ["Web"];
  }
}

// =============================================================================
// PRODUCT DATA
// =============================================================================
// Store artwork and artist credits live in `catalog-card-artwork.ts`.

/**
 * Helvety SPO Explorer - SharePoint Online Extension
 */
const cHelvetyExplorer = cardCore("helvety-spo-explorer", "software");
const helvetyExplorer: SoftwareProduct = {
  id: cHelvetyExplorer.id,
  slug: cHelvetyExplorer.slug,
  name: cHelvetyExplorer.name,
  shortDescription: cHelvetyExplorer.shortDescription,
  type: cHelvetyExplorer.type,
  category: cHelvetyExplorer.category,
  ...catalogArtwork("helvety-spo-explorer"),
  description: {
    intro:
      "Helvety SPO Explorer adds a site switcher to SharePoint so you can open any site you already have access to without hunting through admin hubs. IT deploys it once from the tenant App Catalog; everyday users just pick sites from the header.",
    sections: [
      {
        heading: "Who installs it, who uses it",
        kind: "paragraph",
        body: `The solution is ${HELVETY_FREE_SOURCE_INLINE}; see the repository LICENSE for the exact open-source terms. It is tenant-deployed from the SharePoint App Catalog. End users need normal Microsoft 365 permissions for the sites they expect to see; no separate Helvety account exists for this product.`,
      },
      {
        heading: "What you get in day-to-day use",
        kind: "bullets",
        items: [
          "Pull the accessible-site list instead of bouncing through admin hubs.",
          "Search by title, description, or URL with highlighted matches.",
          "Pin favorites and open them from the header control.",
          "Tune URL display, tab behavior, and related options from settings.",
        ],
      },
      {
        heading: "Where it appears",
        kind: "paragraph",
        body: "The control shows on supported modern pages that use the standard shell; it will not appear on classic pages, every list view, or every specialized modern surface. See the GitHub README for page coverage, packaging, and upgrades.",
      },
    ],
  },
  features: [
    "Loads the sites you can access",
    "Search with highlighted matches",
    "Favorites management",
    "Quick access dropdown menu",
    "Customizable settings panel",
    "SharePoint theme awareness (light/dark)",
    "Caches the site list so repeat searches stay fast",
    "Full keyboard navigation and accessibility",
    "Easy SharePoint App Catalog installation",
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-spo-explorer-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "Full extension features",
          "All sites navigation",
          "Favorites and quick access",
          "Settings customization",
          "No account required for download",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    github: "https://github.com/CasparRubin/helvety-spo-explorer",
  },
  software: {
    fileFormat: "sppkg",
    publicPackageId: "spo-explorer",
    requirements: [
      "SharePoint Online",
      "Microsoft 365 environment",
      "SharePoint Administrator role (for installation)",
    ],
    licenseType: "free",
    installationSteps: [
      {
        title: "Download the solution package",
        description:
          "Use Download .sppkg on this page to save the latest Helvety SPO Explorer package (helvety-spo-explorer.sppkg) to your computer.",
      },
      {
        title: "Open your tenant App Catalog",
        description:
          "Sign in as a SharePoint Administrator and go to your organization's tenant App Catalog, the central catalog for the whole Microsoft 365 tenant, not a site collection-only catalog. If you do not have one yet, create it from the SharePoint admin center (Apps -> App catalog) per Microsoft guidance.",
      },
      {
        title: "Upload the .sppkg",
        description:
          "In the App Catalog site, open the Apps for SharePoint library (or equivalent), upload the .sppkg file, then choose Deploy when prompted so the solution is trusted for your tenant.",
      },
      {
        title: "Enable for all sites (recommended)",
        description:
          'When you enable the app, select the option to enable it and add it to all sites (tenant-wide). That registers the application customizer so users do not need a per-site "Add an app" install. Updates: when deploying a newer version, you can leave "add to all sites" unchecked to avoid duplicate Tenant Wide Extensions entries. The existing registration keeps using the updated package.',
      },
      {
        title: "Allow time to propagate",
        description:
          "After the first tenant-wide deployment, allow up to about 20 minutes for the Tenant Wide Extensions list to propagate before expecting the bar on every site.",
      },
      {
        title: "Verify deployment (optional)",
        description:
          "In the App Catalog site, open Site contents → Tenant Wide Extensions and confirm there is an entry for Helvety SPO Explorer (one entry; remove duplicates if you ever see more than one).",
      },
      {
        title: "Use the extension",
        description:
          'On a modern SharePoint site page that uses the standard shell and Top placeholder (for example a communication or team site home page), look for the "Sites you have access to" control in the top area. It does not appear on classic pages, on every list or library view, or on some specialized modern pages. See the project README on GitHub for details.',
      },
    ],
  },
  media: {
    screenshots: [
      {
        src: "https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/1%20-%20SplitButton.png",
        alt: "Helvety SPO Explorer - Navigation bar with split button in light theme",
        type: "image",
      },
      {
        src: "https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/2%20-%20Panel.png",
        alt: "Helvety SPO Explorer - Sites panel displaying available sites in light theme",
        type: "image",
      },
      {
        src: "https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/3%20-%20Settings.png",
        alt: "Helvety SPO Explorer - Settings panel for customizing display preferences",
        type: "image",
      },
      {
        src: "https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/4%20-%20Search.png",
        alt: "Helvety SPO Explorer - Search functionality with highlighted matches",
        type: "image",
      },
      {
        src: "https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/5%20-%20QuickAccessFavorites.png",
        alt: "Helvety SPO Explorer - Quick access dropdown menu showing favorite sites",
        type: "image",
      },
      {
        src: "https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/6%20-%20DarkThemeSplitButton.png",
        alt: "Helvety SPO Explorer - Navigation bar with split button in dark theme",
        type: "image",
      },
      {
        src: "https://raw.githubusercontent.com/CasparRubin/helvety-spo-explorer/main/public/screenshots/7%20-%20DarkThemePanel.png",
        alt: "Helvety SPO Explorer - Sites panel displaying available sites in dark theme",
        type: "image",
      },
    ],
  },
  metadata: {
    targetAudience: [
      "SharePoint administrators",
      "IT departments",
      "Microsoft 365 users",
    ],
    platforms: platformsFromRunsOn(cHelvetyExplorer.runsOn),
    keywords: [
      "sharepoint",
      "navigation",
      "explorer",
      "microsoft 365",
      "sites",
      "privacy",
    ],
    featured: true,
    releaseDate: cHelvetyExplorer.releaseDate,
  },
};

/**
 * Power Platform Configurator (store blurb from shared copy module)
 */
const cPowerPlatformConfigurator = cardCore(
  "helvety-power-platform-configurator",
  "software"
);
const powerPlatformConfigurator: SoftwareProduct = {
  id: cPowerPlatformConfigurator.id,
  slug: cPowerPlatformConfigurator.slug,
  name: cPowerPlatformConfigurator.name,
  shortDescription: cPowerPlatformConfigurator.shortDescription,
  type: cPowerPlatformConfigurator.type,
  category: cPowerPlatformConfigurator.category,
  ...catalogArtwork("helvety-power-platform-configurator"),
  description: {
    intro:
      "Choose how supported Power Automate flow and run URLs open, control the optional survey parameter, and apply visibility or enabled-state preferences to supported model-driven Power Apps record forms.",
    sections: [
      {
        heading: "How it works",
        kind: "paragraph",
        body: "In the Power Automate tab, choose Classic Designer, New Designer, or Paused and control the optional v3survey parameter. In the Power Apps tab, reveal hidden tabs, sections, and controls or enable disabled controls on supported model-driven record forms. These Power Apps modes stop applying when you choose Keep hidden or Keep disabled; reload open forms to restore platform defaults.",
      },
      {
        heading: "Getting it",
        kind: "paragraph",
        body: `${HELVETY_FREE_SOURCE_FEATURE}; see the repository LICENSE for the exact open-source terms. Install from the Chrome Web Store using the button on this page, then track issues on GitHub. No Helvety account is involved.`,
      },
      {
        heading: "Scope",
        kind: "bullets",
        items: [
          "Adjusts flow and run URLs on supported Power Automate hosts while enforcement is active.",
          "Paused mode disables Power Automate URL rewrites but keeps the extension installed.",
          "Power Apps helpers run only on supported model-driven record forms and use the client-side Xrm API.",
          "Canvas apps, list views, dashboards, and controls blocked by platform security are not supported.",
        ],
      },
      {
        heading: "Vendor reality check",
        kind: "paragraph",
        body: "Microsoft can change URLs or form behavior at any time. The Chrome Web Store normally delivers updates automatically, subject to browser and administrator policies; validate behavior against the vendor documentation you rely on.",
      },
    ],
  },
  features: [
    "Classic or new Power Automate designer, or paused (no link changes while installed)",
    "Power Automate survey prompt: Hide by default, or Show when v3survey is already present",
    "Covers flow and run pages on supported Power Automate sites",
    "Reveal hidden tabs, sections, and controls on supported model-driven Power Apps forms",
    "Enable disabled controls exposed by the Power Apps Xrm Client API",
    "Popup appearance preference stored locally on your device",
    "Chrome 111+; current Chromium-based Microsoft Edge when third-party stores are allowed",
    "No account required to install",
    HELVETY_FREE_SOURCE_FEATURE,
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-power-platform-configurator-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "Full extension behavior",
          "No account required to install",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    chromeWebStore: POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL,
    github:
      "https://github.com/CasparRubin/power-platform-configurator-browser-extension-chromium",
  },
  software: {
    requirements: [
      "Google Chrome 111+ or a current Chromium-based Microsoft Edge version",
      "Access to a supported Power Automate flow/run page or model-driven Power Apps record form",
    ],
    licenseType: "free",
    installationSteps: [
      {
        title: "Install from the Chrome Web Store (Chrome)",
        description:
          "Use Add to Chrome on this page to open the official listing, then choose Add to Chrome in the store. Pin the extension from the toolbar menu if you want it always visible.",
      },
      {
        title: "Install in Microsoft Edge",
        description:
          'If your user or administrator policy allows third-party extension stores, open edge://extensions, turn on "Allow extensions from other stores," then install from the same Chrome Web Store listing.',
      },
      {
        title: "Verify the settings you use",
        description:
          "On a supported Power Automate flow or run page, use the Power Automate tab to test Classic Designer, New Designer, Paused, and survey Hide/Show. On a supported model-driven record form, use the Power Apps tab to test revealing hidden elements or enabling disabled controls.",
      },
    ],
  },
  metadata: {
    targetAudience: [
      "Power Automate authors",
      "Power Apps model-driven app makers",
      "Microsoft 365 and Power Platform admins",
    ],
    platforms: platformsFromRunsOn(cPowerPlatformConfigurator.runsOn),
    keywords: [
      "power automate",
      "browser extension",
      "chrome web store",
      "v3",
      "classic editor",
      "new designer",
      "pause",
      "survey",
      "v3survey",
      "power apps",
      "model-driven app",
      "dataverse",
      "xrm",
      "make.powerautomate.com",
      "microsoft 365",
    ],
    featured: true,
    releaseDate: cPowerPlatformConfigurator.releaseDate,
  },
};

/**
 * Helvety Screen Tools - Windows screenshot and live annotation utility
 */
const cHelvetyScreenTools = cardCore("helvety-screen-tools", "software");
const helvetyScreenTools: SoftwareProduct = {
  id: cHelvetyScreenTools.id,
  slug: cHelvetyScreenTools.slug,
  name: cHelvetyScreenTools.name,
  shortDescription: cHelvetyScreenTools.shortDescription,
  type: cHelvetyScreenTools.type,
  category: cHelvetyScreenTools.category,
  ...catalogArtwork("helvety-screen-tools"),
  description: {
    intro:
      "Use a global shortcut to freeze the screen, snap to a window or drag a rectangle, then save or copy the capture. Draw on the live desktop with Live Draw, browse saved PNGs in the home gallery, and open them in the built-in editor to crop, blur, highlight, add text, borders, arrows, a magnifier, or sample colors.",
    sections: [
      {
        heading: "Distribution",
        kind: "paragraph",
        body: `${HELVETY_FREE_SOURCE_FEATURE}; see the repository LICENSE for the exact open-source terms. Releases live on GitHub. Use the Open releases button on this page, choose the architecture that matches your machine, and download the ZIP.`,
      },
      {
        heading: "Workflow highlights",
        kind: "bullets",
        items: [
          "Frozen overlay selection with window snap or free regions.",
          "Live Draw shapes, freehand, and sparkle on a transparent fullscreen overlay.",
          "Home gallery of PNG captures with Recycle Bin delete.",
          "Built-in PNG editor: Canvas, Text, Border, Blur, Highlight, Arrow, Magnifier, Crop, and Color.",
          "Separate hotkeys for capture and Live Draw, including modifier keys.",
          "Tray behavior, optional autostart on packaged builds, and quality tuning from Settings.",
        ],
      },
      {
        heading: "Documentation",
        kind: "paragraph",
        body: "Packaging modes, keyboard maps, and release notes stay in the project README so the latest details are always next to the source.",
      },
    ],
  },
  features: [
    "Global hotkey screenshot capture",
    "Frozen-screen selection overlay with window snapping",
    "Live Draw fullscreen annotation overlay",
    "Home gallery of PNG captures with Recycle Bin delete",
    "Built-in PNG editor with crop, blur, highlight, text, borders, arrows, magnifier, and color picker",
    "Shape tools: arrows, lines, rectangles, circles, ellipses, and free draw",
    "Configurable hotkeys and shortcut modifiers",
    "System tray support with settings-driven behavior",
    HELVETY_FREE_SOURCE_FEATURE,
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-screen-tools-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "All screenshot, Live Draw, gallery, and editor features",
          "No account required",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    website: "https://github.com/CasparRubin/helvety.screentools/releases",
    github: "https://github.com/CasparRubin/helvety.screentools",
  },
  software: {
    fileFormat: "zip",
    requirements: ["Windows 10 or Windows 11"],
    licenseType: "free",
    installationSteps: [
      {
        title: "Open GitHub Releases",
        description:
          "Use the Open releases button on this page to open the Helvety Screen Tools GitHub Releases page.",
      },
      {
        title: "Download the ZIP asset",
        description:
          "Choose the latest release and download the ZIP for your platform (for example win-x64 or win-arm64).",
      },
      {
        title: "Extract the archive",
        description:
          "Extract the ZIP to a folder you keep on disk, then open that folder in File Explorer.",
      },
      {
        title: "Run the app",
        description:
          "Start helvety.screentools.exe from the extracted folder and configure hotkeys in Settings if needed.",
      },
    ],
  },
  metadata: {
    targetAudience: [
      "Windows users creating screenshots",
      "Developers and support teams",
      "Presenters and educators",
    ],
    platforms: platformsFromRunsOn(cHelvetyScreenTools.runsOn),
    keywords: [
      "screenshot",
      "screen capture",
      "annotation",
      "windows",
      "winui",
      "live draw",
      "hotkey",
      "gallery",
      "png editor",
    ],
    featured: true,
    releaseDate: cHelvetyScreenTools.releaseDate,
  },
};

/**
 * Helvety Power Platform Tools - portable Dataverse desktop app with drop-in modules
 */
const cHelvetyPowerPlatformTools = cardCore(
  "helvety-power-platform-tools",
  "software"
);
const helvetyPowerPlatformTools: SoftwareProduct = {
  id: cHelvetyPowerPlatformTools.id,
  slug: cHelvetyPowerPlatformTools.slug,
  name: cHelvetyPowerPlatformTools.name,
  shortDescription: cHelvetyPowerPlatformTools.shortDescription,
  type: cHelvetyPowerPlatformTools.type,
  category: cHelvetyPowerPlatformTools.category,
  ...catalogArtwork("helvety-power-platform-tools"),
  description: {
    intro:
      "Helvety Power Platform Tools is a portable Windows desktop app that talks to Dataverse in your user context. There is no admin installer and no Microsoft Graph access.",
    sections: [
      {
        heading: "Distribution",
        kind: "paragraph",
        body: `${HELVETY_FREE_SOURCE_FEATURE}; see the repository LICENSE for the exact open-source terms. The core Windows ZIP is hosted on this Store page. Use the Download button, extract the archive, and run the app. Flow Explorer and Web Resource Explorer ship in the core ZIP and can also be added from the Modules section below.`,
      },
      {
        heading: "Workflow highlights",
        kind: "bullets",
        items: [
          "Sign in with your Microsoft work or school account in the system browser.",
          "Pick a Dataverse environment from Global Discovery.",
          "Read records and metadata with the permissions you already have.",
          "Add drop-in modules from the modules folder, including Flow Explorer and Web Resource Explorer.",
        ],
      },
      {
        heading: "Documentation",
        kind: "paragraph",
        body: "Auth, packaging, and module layout stay in the project README so the latest details sit next to the source.",
      },
    ],
  },
  features: [
    "Sign in with your Microsoft work or school account",
    "Pick a Dataverse environment from Global Discovery",
    "Read Dataverse records and metadata in your user context",
    "Drop-in modules, including Flow Explorer and Web Resource Explorer",
    "Portable ZIP with no admin installer",
    HELVETY_FREE_SOURCE_FEATURE,
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-power-platform-tools-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "Core app and published modules",
          "No account required to download",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    github: "https://github.com/CasparRubin/helvety-power-platform-tools",
  },
  software: {
    fileFormat: "zip",
    requirements: ["Windows 10 or Windows 11"],
    licenseType: "free",
    publicPackageId: "power-platform-tools",
    modules: [
      {
        id: "flow-explorer",
        name: "Flow Explorer",
        description:
          "See what a cloud flow touches, and which flows use a Dataverse table.",
        publicPackageId: "flow-explorer",
        fileFormat: "zip",
      },
      {
        id: "web-resource-explorer",
        name: "Web Resource Explorer",
        description:
          "Search Dataverse image web resources and copy their unique names, with live icon previews.",
        publicPackageId: "web-resource-explorer",
        fileFormat: "zip",
      },
    ],
    installationSteps: [
      {
        title: "Download the core ZIP",
        description:
          "Use the Download button on this page to get Helvety-Power-Platform-Tools-win64.zip.",
      },
      {
        title: "Extract and run",
        description:
          "Extract the ZIP to a folder you keep on disk, then start Helvety Power Platform Tools.exe.",
      },
      {
        title: "Sign in and pick an environment",
        description:
          "Sign in with your Microsoft work or school account, then choose a Dataverse environment.",
      },
      {
        title: "Optional: add a module",
        description:
          "Download a module ZIP from the Modules section, extract it, and copy the module folder into the app modules directory. In the app, use Open modules folder.",
      },
    ],
  },
  metadata: {
    targetAudience: [
      "Power Platform makers",
      "Dataverse administrators and makers",
      "Consultants inspecting cloud flows",
    ],
    platforms: platformsFromRunsOn(cHelvetyPowerPlatformTools.runsOn),
    keywords: [
      "dataverse",
      "power platform",
      "cloud flow",
      "windows",
      "desktop",
      "flow explorer",
      "web resource explorer",
    ],
    featured: true,
    releaseDate: cHelvetyPowerPlatformTools.releaseDate,
  },
};

// =============================================================================
// HELVETY PDF
// =============================================================================

/**
 * Helvety PDF - PDF Toolkit
 */
const cHelvetyPdf = cardCore("helvety-pdf", "saas");
const helvetyPdf: SaaSProduct = {
  id: cHelvetyPdf.id,
  slug: cHelvetyPdf.slug,
  name: cHelvetyPdf.name,
  shortDescription: cHelvetyPdf.shortDescription,
  type: cHelvetyPdf.type,
  category: cHelvetyPdf.category,
  description: {
    intro:
      "Combine pages from several files, turn them, pull one page out, or drop images into the same document. The file stays in the browser tab. Helvety is Switzerland-first and not offered in the EU/EEA; see our Privacy Policy for details.",
    sections: [
      {
        heading: "Access",
        kind: "paragraph",
        body: "No account is required. The app is free to use.",
      },
      {
        heading: "What you can do",
        kind: "bullets",
        items: [
          "Combine PDFs and images (JPEG, PNG, GIF, WebP, BMP, and TIFF) in one download.",
          "Drag thumbnails to reorder, rotate in quarter turns, or pull a single page out.",
          "Up to 100 MB per file, 20 open files, and 200 pages per file. Speed still depends on your device and browser.",
        ],
      },
      {
        heading: "Privacy",
        kind: "paragraph",
        body: "The file stays in your browser, the same way it would in an offline editor.",
      },
    ],
  },
  ...catalogArtwork("helvety-pdf"),
  features: [
    "Client-side processing for supported operations",
    "Merge multiple PDFs and images into one document",
    "Drag & drop page reordering with thumbnails",
    "Rotate pages by 90° increments",
    "Extract individual pages as separate PDFs",
    "Image support (JPEG, PNG, GIF, WebP, BMP, and TIFF)",
    "Up to 100 MB per file, 20 open files, and 200 pages per file",
    "No login or account required",
    "Dark & light mode support",
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-pdf-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "All PDF tools included",
          "Up to 100 MB per file",
          "Up to 20 open files",
          "Up to 200 pages per file",
          "No account required",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/pdf",
    github: "https://github.com/CasparRubin/helvety/tree/main/apps/pdf",
  },
  saas: {
    appUrl: "https://helvety.com/pdf",
    hasApiAccess: false,
  },
  metadata: {
    targetAudience: ["Anyone who works with PDFs", "Privacy-conscious users"],
    platforms: platformsFromRunsOn(cHelvetyPdf.runsOn),
    keywords: [
      "pdf",
      "merge",
      "rotate",
      "extract",
      "privacy",
      "free",
      "client-side",
    ],
    featured: true,
    releaseDate: cHelvetyPdf.releaseDate,
  },
};

// =============================================================================
// HELVETY IMAGE EDITOR
// =============================================================================

/** Helvety Image Editor - in-browser image annotation. */
const cHelvetyImageEditor = cardCore("helvety-image-editor", "saas");
const helvetyImageEditor: SaaSProduct = {
  id: cHelvetyImageEditor.id,
  slug: cHelvetyImageEditor.slug,
  name: cHelvetyImageEditor.name,
  shortDescription: cHelvetyImageEditor.shortDescription,
  type: cHelvetyImageEditor.type,
  category: cHelvetyImageEditor.category,
  description: {
    intro:
      "Mark up a PNG, JPEG, or WebP screenshot in the browser: text, arrows, borders, highlights, blur, and crop. A highlight dims the rest of the image. Layers and zoom help with detail, and you can set stroke, blur, dim, and corner radius in the tool bar. The image stays in your browser (up to 25 MB). Helvety is Switzerland-first and not offered in the EU/EEA; see our Privacy Policy for details.",
    sections: [
      {
        heading: "Access",
        kind: "paragraph",
        body: "Open the tool without signing in. It is free to use.",
      },
      {
        heading: "What you can adjust",
        kind: "bullets",
        items: [
          "Select, move, and resize annotations on a layered canvas.",
          "Add text, tapered arrows, bordered boxes, highlights, and blur regions with straight or rounded corners.",
          "Crop the canvas and export PNG or JPEG.",
          "Reorder or delete layers from the panel on desktop, or the layers sheet on a phone.",
          "Zoom in and out, fit the image to the view, and set colors, stroke width, blur radius, dim, and corner radius in the tool bar.",
        ],
      },
      {
        heading: "Privacy",
        kind: "paragraph",
        body: "Edits stay in your browser, so you can redact or mark up a screenshot before you share it.",
      },
    ],
  },
  ...catalogArtwork("helvety-image-editor"),
  features: [
    "Text, arrow, border, highlight, blur, and crop tools",
    "Layers panel with reorder, select, and delete",
    "Tool properties bar with color pickers, sliders and number inputs for stroke/blur/dim/corner radius/font size, and per-layer edits",
    "Zoom and fit-to-view for large screenshots",
    "PNG and JPEG export",
    "Up to 25 MB per image",
    "No login or account required",
    "Dark & light mode support",
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-image-editor-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "All image editor features included",
          "Up to 25 MB per image",
          "No account required",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/image-editor",
    github:
      "https://github.com/CasparRubin/helvety/tree/main/apps/image-editor",
  },
  saas: {
    appUrl: "https://helvety.com/image-editor",
    hasApiAccess: false,
  },
  metadata: {
    targetAudience: [
      "Teams sharing screenshots",
      "Privacy-conscious users",
      "Anyone annotating images for documents or support",
    ],
    platforms: platformsFromRunsOn(cHelvetyImageEditor.runsOn),
    keywords: [
      "image editor",
      "image annotation",
      "blur",
      "highlight",
      "crop",
      "zoom",
      "layers",
      "browser",
      "client-side",
      "privacy",
      "free",
    ],
    featured: true,
    releaseDate: cHelvetyImageEditor.releaseDate,
  },
};

// =============================================================================
// HELVETY OCR
// =============================================================================

/** Helvety OCR - in-browser text extraction from PDFs and images. */
const cHelvetyOcr = cardCore("helvety-ocr", "saas");
const helvetyOcr: SaaSProduct = {
  id: cHelvetyOcr.id,
  slug: cHelvetyOcr.slug,
  name: cHelvetyOcr.name,
  shortDescription: cHelvetyOcr.shortDescription,
  type: cHelvetyOcr.type,
  category: cHelvetyOcr.category,
  description: {
    intro:
      "Turn a scan, photo, or PDF into plain text you can read, copy, or download. English and German recognition run on your device. A born-digital PDF uses its text layer first, and OCR runs only when that layer is not enough. Files stay in your browser (up to 100 MB, 50 PDF pages). Helvety is Switzerland-first and not offered in the EU/EEA; see our Privacy Policy for details.",
    sections: [
      {
        heading: "Access",
        kind: "paragraph",
        body: "Open the tool without signing in. It is free to use.",
      },
      {
        heading: "What it handles",
        kind: "bullets",
        items: [
          "Images in PNG, JPEG, and WebP formats.",
          "Scanned or image-only PDFs, transcribed page by page with on-device OCR.",
          "Born-digital PDFs, where the existing text layer is used first and OCR runs when that layer is insufficient.",
          "English and German text recognition, selectable in the sidebar.",
          "Per-file ceiling of 100 MB and up to 50 pages per PDF; actual throughput depends on your device.",
        ],
      },
      {
        heading: "Privacy",
        kind: "paragraph",
        body: "The file stays in your browser, so you can pull text from a sensitive document without uploading it.",
      },
    ],
  },
  ...catalogArtwork("helvety-ocr"),
  features: [
    "Client-side OCR for scanned pages and images",
    "Born-digital PDFs use their text layer first, with OCR fallback when needed",
    "PNG, JPEG, and WebP image support",
    "English and German recognition",
    "Read, copy, or download extracted text as .txt",
    "Up to 100 MB per file and 50 PDF pages",
    "No login or account required",
    "Dark & light mode support",
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-ocr-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "All OCR features included",
          "Up to 100 MB per file",
          "Up to 50 pages per PDF",
          "No account required",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/ocr",
    github: "https://github.com/CasparRubin/helvety/tree/main/apps/ocr",
  },
  saas: {
    appUrl: "https://helvety.com/ocr",
    hasApiAccess: false,
  },
  metadata: {
    targetAudience: [
      "Anyone extracting text from scans or PDFs",
      "Privacy-conscious users",
      "People digitizing documents or receipts",
    ],
    platforms: platformsFromRunsOn(cHelvetyOcr.runsOn),
    keywords: [
      "ocr",
      "optical character recognition",
      "pdf to text",
      "image to text",
      "scanned document",
      "text extraction",
      "browser",
      "client-side",
      "privacy",
      "free",
    ],
    featured: true,
    releaseDate: cHelvetyOcr.releaseDate,
  },
};

// =============================================================================
// ALL PRODUCTS
// =============================================================================

/**
 * All available products
 */
/** Source order matches oldest → newest (see `@helvety/shared/store-catalog` tie priority). */
const products: Product[] = [
  helvetyPdf,
  helvetyExplorer,
  powerPlatformConfigurator,
  helvetyScreenTools,
  helvetyImageEditor,
  helvetyOcr,
  helvetyPowerPlatformTools,
];

// =============================================================================
// DATA ACCESS FUNCTIONS
// =============================================================================

/**
 * Get all products
 */
export function getAllProducts(): Product[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  return getStoreCatalogNewestFirst()
    .map((card) => byId.get(card.id))
    .filter((product): product is Product => product !== undefined);
}

/**
 * Get a product by its slug
 * @param slug
 */
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

/**
 * Get products filtered by criteria
 * @param filters
 */
/** Returns products filtered by ecosystem category (`filters.category`). */
export function getFilteredProducts(filters: ProductFilters): Product[] {
  const all = getAllProducts();
  if (!filters.category || filters.category === "all") {
    return all;
  }
  return all.filter((product) => product.category === filters.category);
}

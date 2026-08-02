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

import { productArtwork } from "@/lib/data/product-artwork";
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
// Store artwork uses static imports for immutable, content-hashed caching.

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
  image: productArtwork.artwork1,
  artist: "Alexandre Calame",
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
    "Site Discovery - auto-fetch all accessible sites",
    "Real-time search with highlighted matches",
    "Favorites management",
    "Quick access dropdown menu",
    "Customizable settings panel",
    "SharePoint theme awareness (light/dark)",
    "Performance optimized with caching",
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
  image: productArtwork.artwork6,
  artist: "Rudolf Koller",
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
  image: productArtwork.artwork8,
  artist: "Ferdinand Hodler",
  description: {
    intro:
      "Helvety Screen Tools is a small Windows desktop app for two jobs: grab a screenshot with a global hotkey, or draw on a transparent layer that sits above your desktop.",
    sections: [
      {
        heading: "Distribution",
        kind: "paragraph",
        body: `${HELVETY_FREE_SOURCE_FEATURE}; see the repository LICENSE for the exact open-source terms. Releases live on GitHub. Use the Go to App button on this page to open GitHub Releases, choose the architecture that matches your machine, and download the ZIP.`,
      },
      {
        heading: "Workflow highlights",
        kind: "bullets",
        items: [
          "Frozen overlay selection with window snap or free regions.",
          "Shape primitives from arrows through ellipses plus freehand strokes.",
          "Separate hotkeys for capture versus Live Draw, with modifier ergonomics.",
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
          "All screenshot and Live Draw features",
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
          "Use the Go to App button on this page to open the Helvety Screen Tools GitHub Releases page.",
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
    ],
    featured: true,
    releaseDate: cHelvetyScreenTools.releaseDate,
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
      "Helvety PDF is a thumbnail-first workbench for everyday PDF jobs: combine files, reorder pages, rotate, pull out a page, or add images. When a tool is supported, your files stay in the browser tab instead of uploading to Helvety.",
    sections: [
      {
        heading: "Access model",
        kind: "paragraph",
        body: "No account is required. The app stays free; we may still enforce reasonable size or rate safeguards so sessions remain dependable.",
      },
      {
        heading: "What fits comfortably",
        kind: "bullets",
        items: [
          "Combine PDFs and raster inputs (PNG, JPEG, WebP, GIF) in one export.",
          "Drag thumbnails to reorder, rotate in quarter turns, or lift single pages out.",
          "Per-file ceiling of 100 MB. Actual throughput still depends on device RAM and the browser you use.",
        ],
      },
      {
        heading: "Privacy posture",
        kind: "paragraph",
        body: "Because the sensitive bytes never leave your tab for those supported flows, you can reason about confidentiality the same way you would with any offline editor, minus the install step.",
      },
    ],
  },
  image: productArtwork.artwork7,
  artist: "Alexandre Calame",
  features: [
    "Client-side processing for supported operations",
    "Merge multiple PDFs and images into one document",
    "Drag & drop page reordering with thumbnails",
    "Rotate pages by 90° increments",
    "Extract individual pages as separate PDFs",
    "Image support (PNG, JPEG, WebP, GIF)",
    "Up to 100MB per file; no app-enforced page-count cap",
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
          "No app-enforced page-count cap",
          "Up to 100MB per file",
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
      "Helvety Image Editor lets you annotate PNG, JPEG, and WebP images in your browser. Add text, arrows, borders, spotlight highlights, blur regions, and crops with a layers panel for reordering and selection, a tool properties bar with color pickers plus sliders and number inputs for stroke, blur, dim, and corner radius, and zoom for detail work on large screenshots. Images are not sent to Helvety for processing in the normal flow. Helvety is Switzerland-first and not offered in the EU/EEA; see our Privacy Policy for details.",
    sections: [
      {
        heading: "Access model",
        kind: "paragraph",
        body: "Launch the tool without signing in. Usage stays free; automated safeguards keep abusive floods from degrading shared infrastructure.",
      },
      {
        heading: "What you can adjust",
        kind: "bullets",
        items: [
          "Select, move, and resize annotations on a layered canvas.",
          "Add text, tapered arrows, bordered boxes, spotlight highlights, and blur regions with straight or rounded corners.",
          "Crop the canvas and export PNG or JPEG at full resolution when your browser allows.",
          "Reorder or delete layers from the right-hand panel on desktop or the mobile layers sheet.",
          "Zoom in and out, reset fit-to-view, and set colors, stroke width, blur radius, dim opacity, and corner radius in the tool properties bar (sliders scale defaults to your image size; number inputs allow finer or larger values).",
        ],
      },
      {
        heading: "Why it fits sensitive screenshots",
        kind: "paragraph",
        body: "Edits stay in your session, which makes it easier to redact or explain screenshots before you share them outside your organization.",
      },
    ],
  },
  image: productArtwork.artwork11,
  artist: "Clara von Rappard",
  features: [
    "Text, arrow, border, highlight, blur, and crop tools",
    "Layers panel with reorder, select, and delete",
    "Tool properties bar with color pickers, sliders and number inputs for stroke/blur/dim/corner radius/font size, and per-layer edits",
    "Zoom and fit-to-view for large screenshots",
    "PNG and JPEG export at full resolution",
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
      "Helvety OCR reads text out of PDFs and images without uploading your files. Drop a scan or photo and on-device optical character recognition transcribes it; drop a born-digital PDF and the app reuses the existing text layer instead of re-recognizing it. When extraction finishes you can read the text on screen, copy it, or download a plain .txt file. Helvety is Switzerland-first and not offered in the EU/EEA; see our Privacy Policy for details.",
    sections: [
      {
        heading: "Access model",
        kind: "paragraph",
        body: "Open the tool without signing in. Usage stays free; automated safeguards keep abusive floods from degrading shared infrastructure.",
      },
      {
        heading: "What it handles",
        kind: "bullets",
        items: [
          "Images in PNG, JPEG, and WebP formats.",
          "Scanned or image-only PDFs, transcribed page by page with on-device OCR.",
          "Born-digital PDFs, where the existing text layer is extracted directly for speed and accuracy.",
          "English and German text recognition, selectable in the sidebar.",
          "Per-file ceiling of 100 MB and up to 50 pages per PDF; actual throughput depends on your device.",
        ],
      },
      {
        heading: "Privacy posture",
        kind: "paragraph",
        body: "Because the file bytes never leave your browser tab, you can extract text from sensitive documents the same way you would with an offline tool, minus the install step.",
      },
    ],
  },
  image: productArtwork.artwork13,
  artist: "Anny Meisser Vonzun",
  features: [
    "Client-side OCR for scanned pages and images",
    "Born-digital PDFs reuse their existing text layer",
    "PNG, JPEG, and WebP image support",
    "English and German recognition",
    "Read, copy, or download extracted text as .txt",
    "Up to 100MB per file; up to 50 pages per PDF",
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
          "Up to 100MB per file",
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
// HELVETY CLOUD
// =============================================================================

/**
 * Helvety Cloud - end-to-end encrypted workspace (helvety.cloud)
 */
const cHelvetyCloud = cardCore("helvety-cloud", "saas");
const helvetyCloud: SaaSProduct = {
  id: cHelvetyCloud.id,
  slug: cHelvetyCloud.slug,
  name: cHelvetyCloud.name,
  shortDescription: cHelvetyCloud.shortDescription,
  type: cHelvetyCloud.type,
  category: cHelvetyCloud.category,
  description: {
    intro:
      "Private by design: sign in with a one-time email code, unlock encryption with a passkey, and keep workspace content sealed on your device before it reaches our servers. There is no master key.",
    sections: [
      {
        heading: "What you get",
        kind: "bullets",
        items: [
          "Projects, tasks, notes, contacts, boards, comments, and files under one encrypted workspace, with sharing when you invite others.",
          "End-to-end encryption on every plan, including Free. Helvety cannot decrypt your content.",
          "Passwordless account: email one-time code for the session; WebAuthn passkey (PRF) unlocks encryption.",
          "Open source on GitHub; see the repository LICENSE for the exact license terms.",
        ],
      },
      {
        heading: "Pricing",
        kind: "paragraph",
        body: "Start on Free Workspace with fair-use limits (no encrypted file uploads on Free). Upgrade a workspace to Pro Workspace (CHF 250 per year) for higher limits and encrypted files. Capacity Increase add-ons are available for active Pro workspaces.",
      },
      {
        heading: "Recovery and honesty",
        kind: "paragraph",
        body: "You hold the recovery file. Helvety cannot read or recover encrypted content. Losing your passkey and recovery file means permanent loss of that content. Session login is not the same as encryption unlock.",
      },
    ],
  },
  image: productArtwork.artwork3,
  artist: "Alexandre Calame",
  features: [
    "End-to-end encryption on every plan; Helvety cannot decrypt your content",
    "E2EE / zero-access design: no master key, no escrow, no support content recovery",
    "Passwordless: email one-time code; unlock encryption with a passkey",
    "Workspace-scoped projects, tasks, notes, contacts, boards, comments, and files",
    "Invite others by sealing the workspace key to them",
    "User-held recovery file; lost passkey and recovery means permanent loss",
    "Open source with published source on GitHub",
    "Free Workspace to start; Pro Workspace for higher limits and encrypted files",
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-cloud-free",
        name: "Free Workspace",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "End-to-end encryption",
          "Fair-use workspace limits",
          "No encrypted file uploads",
          "One free workspace per user",
        ],
      },
      {
        id: "helvety-cloud-pro",
        name: "Pro Workspace",
        price: 25000,
        currency: "CHF",
        interval: "year",
        highlighted: true,
        features: [
          "Higher workspace limits",
          "Encrypted file and document storage",
          "Capacity Increase add-ons available",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.cloud",
    github: "https://github.com/CasparRubin/helvety-cloud",
  },
  saas: {
    appUrl: "https://helvety.cloud",
    hasApiAccess: false,
  },
  metadata: {
    targetAudience: [
      "Privacy-conscious professionals",
      "Teams and individuals who want end-to-end encrypted workspaces",
    ],
    platforms: platformsFromRunsOn(cHelvetyCloud.runsOn),
    keywords: [
      "cloud",
      "e2ee",
      "end-to-end encryption",
      "zero-access",
      "workspace",
      "tasks",
      "notes",
      "contacts",
      "boards",
      "passkey",
      "privacy",
      "switzerland",
    ],
    featured: true,
    releaseDate: cHelvetyCloud.releaseDate,
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
  helvetyCloud,
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

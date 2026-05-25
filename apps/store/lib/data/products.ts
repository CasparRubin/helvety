/**
 * Static product data for the Store app (@helvety/store)
 */

import {
  HELVETY_FREE_AGPL_FEATURE,
  HELVETY_FREE_AGPL_INLINE,
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
 * `@helvety/shared/store-catalog`, narrowed to the literal `type` the caller
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
        body: `The solution is ${HELVETY_FREE_AGPL_INLINE}, and tenant-deployed from the SharePoint App Catalog. End users need normal Microsoft 365 permissions for the sites they expect to see; no separate Helvety account exists for this product.`,
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
  status: "available",
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
      "When Power Automate keeps opening the wrong flow designer or asking why you switched, this extension lets you pick classic or new and keep that choice. You can tame the follow-up survey, or use Paused to leave the add-on installed without changing links.",
    sections: [
      {
        heading: "How it works",
        kind: "paragraph",
        body: "While enforcement is on, flow and run pages on Power Automate sites open with the designer you selected. The Survey tab controls Microsoft's optional prompt: Hide (default) keeps it off when links are adjusted; Show only tidies URLs that already include the survey parameter. Paused turns off all link changes until you turn enforcement back on.",
      },
      {
        heading: "Getting it",
        kind: "paragraph",
        body: `${HELVETY_FREE_AGPL_FEATURE}. Install from the Chrome Web Store using the button on this page, then track issues on GitHub. No Helvety account is involved.`,
      },
      {
        heading: "Scope",
        kind: "bullets",
        items: [
          "Works on Power Automate web hosts (powerautomate.com and flow.microsoft.com).",
          "Adjusts flow and run links when enforcement is active.",
          "Paused mode disables rewrites but keeps the extension installed.",
          "Built for current Edge and Chrome extension policies.",
        ],
      },
      {
        heading: "Vendor reality check",
        kind: "paragraph",
        body: "Microsoft can change URLs or the editor at any time. The Chrome Web Store delivers updates automatically; validate behavior against the vendor documentation you rely on.",
      },
    ],
  },
  status: "available",
  features: [
    "Classic or new Power Automate designer, or paused (no link changes while installed)",
    "Survey tab: Hide by default, or Show when the survey parameter is already present",
    "Covers flow and run pages on supported Power Automate sites",
    "Popup appearance preference stored locally on your device",
    "For Microsoft Edge and Google Chrome",
    "No account required to install",
    HELVETY_FREE_AGPL_FEATURE,
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
      "Microsoft Edge or Google Chrome",
      "Access to https://make.powerautomate.com/",
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
          'In Edge, go to edge://extensions and turn on "Allow extensions from other stores" in the sidebar. Open the same Chrome Web Store listing from this page and choose Get to install the extension.',
      },
      {
        title: "Verify in Power Automate",
        description:
          "Open https://make.powerautomate.com/ and open or edit a flow or run. In the extension popup, pick classic or new designer on the Editor tab and confirm pages open the way you expect. Switch to Paused to confirm links stop changing. On the Survey tab, try Hide vs Show to see how the follow-up prompt behaves.",
      },
    ],
  },
  metadata: {
    targetAudience: [
      "Power Automate authors",
      "Microsoft 365 admins and makers",
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
        body: `${HELVETY_FREE_AGPL_FEATURE}; releases live on GitHub. Use the Go to App button on this page to open GitHub Releases, choose the architecture that matches your machine, and download the ZIP.`,
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
  status: "available",
  features: [
    "Global hotkey screenshot capture",
    "Frozen-screen selection overlay with window snapping",
    "Live Draw fullscreen annotation overlay",
    "Shape tools: arrows, lines, rectangles, circles, ellipses, and free draw",
    "Configurable hotkeys and shortcut modifiers",
    "System tray support with settings-driven behavior",
    HELVETY_FREE_AGPL_FEATURE,
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
  status: "available",
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
      "split",
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
// HELVETY IMAGE UPSCALER
// =============================================================================

/** Helvety Image Upscaler - in-browser image upscaler with on-device AI. */
const cHelvetyImageUpscaler = cardCore("helvety-image-upscaler", "saas");
const helvetyImageUpscaler: SaaSProduct = {
  id: cHelvetyImageUpscaler.id,
  slug: cHelvetyImageUpscaler.slug,
  name: cHelvetyImageUpscaler.name,
  shortDescription: cHelvetyImageUpscaler.shortDescription,
  type: cHelvetyImageUpscaler.type,
  category: cHelvetyImageUpscaler.category,
  description: {
    intro:
      "Helvety Image Upscaler enlarges PNG, JPEG, and WebP photos in your browser. AI upscaling runs on your device when supported; otherwise the app falls back to high-quality resizing. Images are not sent to Helvety for processing in the normal flow. Helvety is Switzerland-first and not actively marketed to EU/EEA users; see our Privacy Policy for details.",
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
          "Choose 2× or 4× upscale, or set a target width or height.",
          "Process up to five images per batch and download them one by one or together.",
          "The AI model downloads on first use and stays cached for later runs.",
          "Very large images may be limited so your browser tab stays stable.",
        ],
      },
      {
        heading: "Why it fits sensitive screenshots",
        kind: "paragraph",
        body: "Frames never leave your session in the supported pipeline, including the AI flow, which makes it easier to audit your own asset workflow when polishing marketing shots or reference stills.",
      },
    ],
  },
  status: "available",
  image: productArtwork.artwork2,
  artist: "Alexandre Calame",
  features: [
    "On-device AI upscaling when your browser supports it",
    "High-quality resize fallback when AI is unavailable",
    "Model downloads once and stays cached for later use",
    "2× and 4× scale presets",
    "Target width or height with aspect ratio preserved",
    "Batch processing (up to 5 images)",
    "No login or account required",
    "Dark & light mode support",
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-image-upscaler-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "All image upscaler features included",
          "No account required",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/image-upscaler",
    github:
      "https://github.com/CasparRubin/helvety/tree/main/apps/image-upscaler",
  },
  saas: {
    appUrl: "https://helvety.com/image-upscaler",
    hasApiAccess: false,
  },
  metadata: {
    targetAudience: [
      "Creators and designers",
      "Privacy-conscious users",
      "Anyone resizing images for web or documents",
    ],
    platforms: platformsFromRunsOn(cHelvetyImageUpscaler.runsOn),
    keywords: [
      "image upscaler",
      "AI image upscaler",
      "Real-ESRGAN",
      "onnxruntime-web",
      "WebGPU",
      "browser image resize",
      "canvas",
      "client-side",
      "privacy",
      "free",
    ],
    featured: true,
    releaseDate: cHelvetyImageUpscaler.releaseDate,
  },
};

// =============================================================================
// HELVETY TASKS
// =============================================================================

/**
 * Helvety Tasks - E2E Encrypted Task Management
 */
const cHelvetyTasks = cardCore("helvety-tasks", "saas");
const helvetyTasks: SaaSProduct = {
  id: cHelvetyTasks.id,
  slug: cHelvetyTasks.slug,
  name: cHelvetyTasks.name,
  shortDescription: cHelvetyTasks.shortDescription,
  type: cHelvetyTasks.type,
  category: cHelvetyTasks.category,
  description: {
    intro:
      "Helvety Tasks is a stage-based board for work you want to keep private. Titles, descriptions, and schedule fields are encrypted in your browser before they sync; you unlock them with your passkey.",
    sections: [
      {
        heading: "Pricing",
        kind: "paragraph",
        body: "Every productivity feature ships at no charge. There are no upgrade tiers, subscription packages, or per-seat business gatekeeping.",
      },
      {
        heading: "How work flows",
        kind: "bullets",
        items: [
          "Immutable Helvety stages keep everyone aligned on meaning (from backlog through acceptance and The Void).",
          "Labels and priority live in the detail sheet while the board stays readable for status at a glance.",
          "Rich descriptions support headings, lists, and links while staying encrypted.",
          "Link Helvety Contacts when both apps support the relationship metadata.",
        ],
      },
      {
        heading: "Data protection",
        kind: "paragraph",
        body: "Processing follows applicable Swiss data protection law where it applies. Helvety does not hold keys that could read your encrypted task content.",
      },
    ],
  },
  status: "available",
  image: productArtwork.artwork3,
  artist: "Alexandre Calame",
  features: [
    "End-to-end encryption for sensitive task content fields",
    "Task list grouped by fixed stages; labels and priority in details",
    "Rich text editor with formatting",
    "Immutable built-in stages with consistent colors and icons",
    "Labels and priority levels",
    "Contact linking with Helvety Contacts",
    "Drag & drop reordering",
    "Dark & light mode support",
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-tasks-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "All features included",
          "End-to-end encryption",
          "No business/account quotas",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/tasks",
    github: "https://github.com/CasparRubin/helvety/tree/main/apps/tasks",
  },
  saas: {
    appUrl: "https://helvety.com/tasks",
    hasApiAccess: false,
  },
  metadata: {
    targetAudience: [
      "Privacy-conscious professionals",
      "Teams and individuals",
    ],
    platforms: platformsFromRunsOn(cHelvetyTasks.runsOn),
    keywords: [
      "tasks",
      "project management",
      "encrypted",
      "e2e",
      "privacy",
      "productivity",
    ],
    featured: true,
    releaseDate: cHelvetyTasks.releaseDate,
  },
};

// =============================================================================
// HELVETY CONTACTS
// =============================================================================

/**
 * Helvety Contacts - E2E Encrypted Contact Management
 */
const cHelvetyContacts = cardCore("helvety-contacts", "saas");
const helvetyContacts: SaaSProduct = {
  id: cHelvetyContacts.id,
  slug: cHelvetyContacts.slug,
  name: cHelvetyContacts.name,
  shortDescription: cHelvetyContacts.shortDescription,
  type: cHelvetyContacts.type,
  category: cHelvetyContacts.category,
  description: {
    intro:
      "Helvety Contacts is a simple address book that encrypts names, numbers, birthdays, and notes on your device before anything syncs. Sign in with Helvety Auth and use your passkey to unlock your data.",
    sections: [
      {
        heading: "Pricing",
        kind: "paragraph",
        body: "The full address book experience is free, with no premium tier hiding CSV export or multi-category sorting.",
      },
      {
        heading: "Everyday ergonomics",
        kind: "bullets",
        items: [
          "Rich-text notes behave like miniature documents with headings and lists.",
          "Drag-and-drop ordering within a category or across categories keeps tactile muscle memory.",
          "Export an encrypted backup when you need a copy; the wizard explains the format.",
          "Hook tasks to contacts whenever both apps expose the shared linking primitives.",
        ],
      },
      {
        heading: "Data protection",
        kind: "paragraph",
        body: "Processing follows applicable Swiss data protection law where it applies. Helvety does not hold keys that could read your encrypted contact data.",
      },
    ],
  },
  status: "available",
  image: productArtwork.artwork4,
  artist: "Ferdinand Hodler",
  features: [
    "End-to-end encryption for sensitive contact fields",
    "Rich contact fields (name, email, phone, birthday)",
    "Rich text notes with formatting",
    "Immutable built-in categories (Personal, Work, Other)",
    "Task linking with Helvety Tasks",
    "Drag & drop reordering",
    "Self-service encrypted data export",
    "Dark & light mode support",
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-contacts-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "All features included",
          "End-to-end encryption",
          "No business/account quotas",
          "Rich text notes",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/contacts",
    github: "https://github.com/CasparRubin/helvety/tree/main/apps/contacts",
  },
  saas: {
    appUrl: "https://helvety.com/contacts",
    hasApiAccess: false,
  },
  metadata: {
    targetAudience: [
      "Privacy-conscious professionals",
      "Individuals managing personal contacts",
    ],
    platforms: platformsFromRunsOn(cHelvetyContacts.runsOn),
    keywords: [
      "contacts",
      "address book",
      "encrypted",
      "e2e",
      "privacy",
      "crm",
    ],
    featured: true,
    releaseDate: cHelvetyContacts.releaseDate,
  },
};

// =============================================================================
// HELVETY NOTES
// =============================================================================

/**
 * Helvety Notes - E2E Encrypted Notes
 */
const cHelvetyNotes = cardCore("helvety-notes", "saas");
const helvetyNotes: SaaSProduct = {
  id: cHelvetyNotes.id,
  slug: cHelvetyNotes.slug,
  name: cHelvetyNotes.name,
  shortDescription: cHelvetyNotes.shortDescription,
  type: cHelvetyNotes.type,
  category: cHelvetyNotes.category,
  description: {
    intro:
      "Helvety Notes is for quick capture: a title and an optional longer body, both encrypted on your device before they sync. Sign in with Helvety Auth and unlock with your passkey.",
    sections: [
      {
        heading: "Pricing",
        kind: "paragraph",
        body: "Same free stance as the other Helvety productivity apps, with no metering on categories, linking, or editors.",
      },
      {
        heading: "Organization philosophy",
        kind: "bullets",
        items: [
          "Three curated buckets (Personal, Work, Other) make sifting faster than infinite nested folders.",
          "Rich text keeps meeting minutes and scratch ideas in one canvas.",
          "Cross-link into Helvety Tasks or Helvety Contacts only when you enable both apps.",
        ],
      },
      {
        heading: "Data protection",
        kind: "paragraph",
        body: "Processing follows applicable Swiss data protection law where it applies. Helvety does not hold keys that could read your encrypted notes.",
      },
    ],
  },
  status: "available",
  image: productArtwork.artwork5,
  artist: "Rudolf Koller",
  features: [
    "End-to-end encryption for sensitive note content",
    "Note model: encrypted title and description; fixed categories for grouping",
    "Rich text editor with formatting",
    "Link notes with tasks and contacts",
    "Drag & drop reordering",
    "Dark & light mode support",
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-notes-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "All features included",
          "End-to-end encryption",
          "No business/account quotas",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/notes",
    github: "https://github.com/CasparRubin/helvety/tree/main/apps/notes",
  },
  saas: {
    appUrl: "https://helvety.com/notes",
    hasApiAccess: false,
  },
  metadata: {
    targetAudience: [
      "Privacy-conscious professionals",
      "Individuals taking secure notes",
    ],
    platforms: platformsFromRunsOn(cHelvetyNotes.runsOn),
    keywords: [
      "notes",
      "encrypted",
      "e2e",
      "privacy",
      "knowledge",
      "productivity",
    ],
    featured: true,
    releaseDate: cHelvetyNotes.releaseDate,
  },
};

// =============================================================================
// HELVETY LINKS
// =============================================================================

const cHelvetyLinks = cardCore("helvety-links", "saas");
const helvetyLinks: SaaSProduct = {
  id: cHelvetyLinks.id,
  slug: cHelvetyLinks.slug,
  name: cHelvetyLinks.name,
  shortDescription: cHelvetyLinks.shortDescription,
  type: cHelvetyLinks.type,
  category: cHelvetyLinks.category,
  description: {
    intro:
      "Helvety Links stores bookmarks with nested folders. Link names and URLs are encrypted on your device before storage.",
    sections: [
      {
        heading: "Pricing",
        kind: "paragraph",
        body: "Free to use with the same passkey encryption model as other Helvety productivity apps.",
      },
      {
        heading: "Organization",
        kind: "bullets",
        items: [
          "All folder as the library root; nested folders and links live inside it.",
          "Nested folders without a fixed depth limit (currently 2,000 folders and 2,000 links per account for reliability).",
          "Drag-and-drop reorder and reparenting (disabled while search is active).",
          "Open a link in your browser with one click, or open every link in a folder and its subfolders.",
          "Client-side search across decrypted names and URLs.",
        ],
      },
      {
        heading: "Data protection",
        kind: "paragraph",
        body: "Helvety does not hold keys that could read your encrypted bookmarks.",
      },
    ],
  },
  status: "available",
  image: productArtwork.artwork9,
  artist: "Anny Meisser Vonzun",
  features: [
    "End-to-end encryption for bookmark names and URLs",
    "Nested folders without a fixed depth limit",
    "Drag-and-drop reorder and reparenting",
    "Client-side export of decrypted library",
    "Dark and light mode support",
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-links-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "All features included",
          "End-to-end encryption",
          "No business/account quotas",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/links",
    github: "https://github.com/CasparRubin/helvety/tree/main/apps/links",
  },
  saas: {
    appUrl: "https://helvety.com/links",
    hasApiAccess: false,
  },
  metadata: {
    targetAudience: ["Privacy-conscious professionals", "Bookmark power users"],
    platforms: platformsFromRunsOn(cHelvetyLinks.runsOn),
    keywords: ["bookmarks", "links", "encrypted", "e2e", "privacy", "folders"],
    featured: true,
    releaseDate: cHelvetyLinks.releaseDate,
  },
};

// =============================================================================
// HELVETY DOCS
// =============================================================================

/** Helvety Docs - browser .docx editor with optional encrypted vault save. */
const cHelvetyDocs = cardCore("helvety-docs", "saas");
const helvetyDocs: SaaSProduct = {
  id: cHelvetyDocs.id,
  slug: cHelvetyDocs.slug,
  name: cHelvetyDocs.name,
  shortDescription: cHelvetyDocs.shortDescription,
  type: cHelvetyDocs.type,
  category: cHelvetyDocs.category,
  description: {
    intro:
      "Helvety Docs edits Word (.docx) files in your browser. The editor starts blank on each visit; open, create, or upload a document and work locally without signing in. Vault bookmarks may use `?doc=` in URLs, but documents do not auto-open on load. When you choose vault save, document titles and .docx bytes are encrypted on your device before they reach Helvety storage.",
    sections: [
      {
        heading: "Access model",
        kind: "paragraph",
        body: "Local editing needs no account. Optional vault save requires Helvety Auth sign-in and passkey unlock, the same encryption setup used for encrypted Helvety apps.",
      },
      {
        heading: "What you can do",
        kind: "bullets",
        items: [
          "Edit .docx in the tab with familiar word-processor controls.",
          "Upload or start a new document, then download when you are done.",
          "Open saved documents from My documents in the title bar sheet when signed in and vault-unlocked (URLs may show `?doc=` after you open or save).",
          "Save to your vault when signed in (titles and .docx bytes encrypted client-side).",
          "Per-file ceiling of 20 MB. Large documents still depend on device RAM and your browser.",
        ],
      },
      {
        heading: "Third-party editor",
        kind: "paragraph",
        body: "The in-browser editor is powered by @eigenpal/docx-editor-react (Apache-2.0). Helvety app source remains AGPL-3.0-or-later.",
      },
    ],
  },
  status: "available",
  image: productArtwork.artwork11,
  artist: "Clara von Rappard",
  features: [
    "Local .docx editing without an account",
    "Optional vault save with client-side encryption",
    "Upload, create, edit, and download .docx files",
    "Encrypted document titles and .docx bytes when vault save is used",
    "Up to 20MB per file",
    "Dark & light mode support",
  ],
  pricing: {
    hasFreeTier: true,
    tiers: [
      {
        id: "helvety-docs-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "Full local editor included",
          "Optional encrypted vault save when signed in",
          "Up to 20MB per file",
          "No account required for local editing",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/docs",
    github: "https://github.com/CasparRubin/helvety/tree/main/apps/docs",
  },
  saas: {
    appUrl: "https://helvety.com/docs",
    hasApiAccess: false,
  },
  metadata: {
    targetAudience: [
      "Anyone editing Word documents",
      "Privacy-conscious professionals",
    ],
    platforms: platformsFromRunsOn(cHelvetyDocs.runsOn),
    keywords: [
      "docx",
      "word",
      "document",
      "editor",
      "browser",
      "encryption",
      "vault",
      "privacy",
      "free",
    ],
    featured: true,
    releaseDate: cHelvetyDocs.releaseDate,
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
  helvetyTasks,
  helvetyContacts,
  helvetyNotes,
  helvetyLinks,
  powerPlatformConfigurator,
  helvetyScreenTools,
  helvetyImageUpscaler,
  helvetyDocs,
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
export function getFilteredProducts(filters: ProductFilters): Product[] {
  const all = getAllProducts();
  if (!filters.type || filters.type === "all") {
    return all;
  }
  return all.filter((product) => product.type === filters.type);
}

/**
 * Static product data for the Store app (@helvety/store)
 */

import { productArtwork } from "@/lib/data/product-artwork";
import {
  productDescriptionToPlainText,
  type Product,
  type ProductFilters,
  type SaaSProduct,
  type SoftwareProduct,
} from "@/lib/types/products";

/**
 * Catalog default sort is newest `releaseDate` first. Release dates are chosen to
 * reflect product age (not repo history). Intended chronological order, oldest → newest:
 *   PDF → SPO Explorer → Tasks → Contacts → Notes → Power Automate Browser Extension → Screen Tools → Image Upscaler
 *
 * When two products share the same `metadata.releaseDate`, higher number sorts first
 * (treated as newer for display).
 */
const PRODUCT_RELEASE_TIE_PRIORITY: Record<string, number> = {
  "helvety-image-upscaler": 8,
  "helvety-screen-tools": 7,
  "helvety-power-automate-force-v3-false": 6,
  "helvety-notes": 5,
  "helvety-contacts": 4,
  "helvety-tasks": 3,
  "helvety-spo-explorer": 2,
  "helvety-pdf": 1,
};

/** Newest `releaseDate` first; ties use {@link PRODUCT_RELEASE_TIE_PRIORITY}. */
function compareProductsByReleaseDateNewestFirst(
  a: Product,
  b: Product
): number {
  const dateA = a.metadata?.releaseDate ?? "";
  const dateB = b.metadata?.releaseDate ?? "";
  const cmp = dateB.localeCompare(dateA);
  if (cmp !== 0) return cmp;
  const pa = PRODUCT_RELEASE_TIE_PRIORITY[a.id] ?? 0;
  const pb = PRODUCT_RELEASE_TIE_PRIORITY[b.id] ?? 0;
  return pb - pa;
}

/** Oldest `releaseDate` first; pairs with sort direction like other sort modes. */
function compareProductsByReleaseDateOldestFirst(
  a: Product,
  b: Product
): number {
  return compareProductsByReleaseDateNewestFirst(b, a);
}

// =============================================================================
// PRODUCT DATA
// =============================================================================
// Store artwork uses static imports for immutable, content-hashed caching.

/**
 * Helvety SPO Explorer - SharePoint Online Extension
 */
const helvetyExplorer: SoftwareProduct = {
  id: "helvety-spo-explorer",
  slug: "helvety-spo-explorer",
  name: "Helvety SPO Explorer",
  shortDescription:
    "SharePoint site picker and search in the header—favorites and preferences stay on the device, not on Helvety servers.",
  image: productArtwork.artwork1,
  artist: "Alexandre Calame",
  description: {
    intro:
      "Helvety SPO Explorer is an SPFx application customizer that drops a fast site switcher into Microsoft 365. Where supported, discovery and navigation run in the browser, while favorites and preferences remain only on your device (for example in localStorage).",
    sections: [
      {
        heading: "Who installs it, who uses it",
        kind: "paragraph",
        body: "The solution is free, open source, and tenant-deployed from the SharePoint App Catalog. End users need normal Microsoft 365 permissions for the sites they expect to see; no separate Helvety account exists for this product.",
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
  type: "software",
  category: "integrations",
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
    hasYearlyPricing: false,
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
    platforms: ["SharePoint Online", "Microsoft 365"],
    keywords: [
      "sharepoint",
      "navigation",
      "explorer",
      "microsoft 365",
      "sites",
      "privacy",
    ],
    featured: true,
    releaseDate: "2025-10-05",
  },
};

/**
 * Power Automate browser extension - forces v3=false for classic Power Automate editor URLs
 */
const powerAutomateForceV3False: SoftwareProduct = {
  id: "helvety-power-automate-force-v3-false",
  slug: "helvety-power-automate-force-v3-false",
  name: "Power Automate Browser Extension",
  shortDescription:
    "A minimal Edge/Chrome extension that keeps Power Automate flow and run URLs on the classic editor by ensuring v3=false and normalizing v3survey=false when present.",
  image: productArtwork.artwork6,
  artist: "Rudolf Koller",
  description: {
    intro:
      "A compact Manifest V3 extension for Edge and Chrome that rewrites Microsoft Power Automate URLs on *.powerautomate.com and flow.microsoft.com. Paths under /flows/ and /runs/ get v3=false so the classic editor keeps loading the way you expect.",
    sections: [
      {
        heading: "Mechanics",
        kind: "paragraph",
        body: "The extension adds v3=false when missing, replaces v3=true when present, and normalizes v3survey=false when that flag exists. Declarative rules plus runtime hooks cover first paint, refresh, back/forward, and typical SPA transitions inside Power Automate—not only full page loads.",
      },
      {
        heading: "Getting it",
        kind: "paragraph",
        body: "Free and open source. Download the ZIP from this Store page, load it unpacked with developer mode, then track issues on GitHub. No Helvety account is involved.",
      },
      {
        heading: "Scope",
        kind: "bullets",
        items: [
          "Host allow-list centres on Power Automate domains.",
          "Only /flows/ and /runs/ paths are rewritten.",
          "Manifest V3 aligned with current browser policies.",
        ],
      },
      {
        heading: "Vendor reality check",
        kind: "paragraph",
        body: "Microsoft can change URLs or the editor at any time—validate against the exact build you install and the vendor documentation you rely on.",
      },
    ],
  },
  type: "software",
  category: "integrations",
  status: "available",
  features: [
    "Scoped to Power Automate hosts (*.powerautomate.com and flow.microsoft.com)",
    "Forces v3=false on /flows/ and /runs/ URLs",
    "Normalizes v3survey=false when the parameter exists",
    "Works with SPA navigation (History API)",
    "Manifest V3 (Edge and Chrome)",
    "No account required for download",
    "Free and open source",
  ],
  pricing: {
    hasFreeTier: true,
    hasYearlyPricing: false,
    tiers: [
      {
        id: "helvety-power-automate-force-v3-false-free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        isFree: true,
        features: [
          "Full extension behavior",
          "No account required for download",
          "Free to use",
        ],
      },
    ],
  },
  links: {
    github: "https://github.com/CasparRubin/power-automate-force-v3-false",
  },
  software: {
    fileFormat: "zip",
    publicPackageId: "power-automate-force-v3-false",
    requirements: [
      "Microsoft Edge or Google Chrome",
      "Access to https://make.powerautomate.com/",
      "Permission to turn on developer mode and load unpacked extensions",
    ],
    licenseType: "free",
    installationSteps: [
      {
        title: "Download the ZIP",
        description:
          "Use the Download button on this page to save power-automate-force-v3-false.zip to your computer.",
      },
      {
        title: "Extract the archive",
        description:
          'Unzip the file into a folder you can keep permanently (for example under Documents). Chromium requires a real folder on disk. You cannot point "Load unpacked" at the ZIP file itself.',
      },
      {
        title: "Open the extensions page (Edge)",
        description:
          "In Microsoft Edge, go to edge://extensions (paste into the address bar). Turn on Developer mode using the toggle in the sidebar.",
      },
      {
        title: "Open the extensions page (Chrome)",
        description:
          "In Google Chrome, go to chrome://extensions and enable Developer mode.",
      },
      {
        title: "Load the extension",
        description:
          "Click Load unpacked and select the extracted folder, the one that contains manifest.json (not a parent directory).",
      },
      {
        title: "Verify in Power Automate",
        description:
          "Open https://make.powerautomate.com/ and open or edit a flow or run. URLs should include v3=false so the classic editor loads as expected.",
      },
    ],
  },
  metadata: {
    targetAudience: [
      "Power Automate authors",
      "Microsoft 365 admins and makers",
    ],
    platforms: ["Microsoft Edge", "Google Chrome"],
    keywords: [
      "power automate",
      "browser extension",
      "v3",
      "classic editor",
      "make.powerautomate.com",
      "microsoft 365",
    ],
    featured: true,
    releaseDate: "2026-04-03",
  },
};

/**
 * Helvety Screen Tools - Windows screenshot and live annotation utility
 */
const helvetyScreenTools: SoftwareProduct = {
  id: "helvety-screen-tools",
  slug: "helvety-screen-tools",
  name: "Helvety Screen Tools",
  shortDescription:
    "A WinUI 3 desktop app for Windows with global-hotkey screenshot capture and Live Draw overlay annotation over the real desktop.",
  image: productArtwork.artwork8,
  artist: "Ferdinand Hodler",
  description: {
    intro:
      "Helvety Screen Tools is a WinUI 3 Windows desktop companion built around two workflows: freeze-frame capture with a global hotkey, and a transparent Live Draw layer you can sketch on without leaving the desktop.",
    sections: [
      {
        heading: "Distribution",
        kind: "paragraph",
        body: "Open source and free; releases live on GitHub. Use the Go to App button on this page to open GitHub Releases, choose the architecture that matches your machine, and download the ZIP.",
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
  type: "software",
  category: "utilities",
  status: "available",
  features: [
    "Global hotkey screenshot capture",
    "Frozen-screen selection overlay with window snapping",
    "Live Draw fullscreen annotation overlay",
    "Shape tools: arrows, lines, rectangles, circles, ellipses, and free draw",
    "Configurable hotkeys and shortcut modifiers",
    "System tray support with settings-driven behavior",
    "Free and open source",
  ],
  pricing: {
    hasFreeTier: true,
    hasYearlyPricing: false,
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
    platforms: ["Windows"],
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
    releaseDate: "2026-04-21",
  },
};

// =============================================================================
// HELVETY PDF
// =============================================================================

/**
 * Helvety PDF - PDF Toolkit
 */
const helvetyPdf: SaaSProduct = {
  id: "helvety-pdf",
  slug: "helvety-pdf",
  name: "Helvety PDF",
  shortDescription:
    "Reorder, merge, rotate, extract, or drop images into a PDF—supported edits stay in your browser instead of uploading the file to Helvety.",
  description: {
    intro:
      "Helvety PDF gives you a thumbnail-first workbench for everyday PDF surgery. When a tool is supported by the current architecture, pages stay inside your browser tab instead of travelling through a Helvety conversion pipeline.",
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
          "Per-file ceiling of 100 MB—actual throughput still depends on device RAM and the browser you use.",
        ],
      },
      {
        heading: "Privacy posture",
        kind: "paragraph",
        body: "Because the sensitive bytes never leave your tab for those supported flows, you can reason about confidentiality the same way you would with any offline editor—minus the install step.",
      },
    ],
  },
  type: "saas",
  category: "utilities",
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
    hasYearlyPricing: false,
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
    platforms: ["Web"],
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
    releaseDate: "2025-09-14",
  },
};

// =============================================================================
// HELVETY IMAGE UPSCALER
// =============================================================================

/**
 * Helvety Image Upscaler - in-browser AI upscaler (Real-ESRGAN via
 * onnxruntime-web with WebGPU/WASM) plus a canvas-resample fallback.
 */
const helvetyImageUpscaler: SaaSProduct = {
  id: "helvety-image-upscaler",
  slug: "helvety-image-upscaler",
  name: "Helvety Image Upscaler",
  shortDescription:
    "Browser-based image upscaler with on-device AI (Real-ESRGAN via WebGPU/WASM) and a canvas-resample fallback: 2×/4× batches, target width or height with locked aspect ratio, and limits so tabs stay responsive.",
  description: {
    intro:
      "Helvety Image Upscaler runs a Real-ESRGAN ONNX model inside a Web Worker via onnxruntime-web (WebGPU with WASM fallback) so PNG, JPEG, and WebP images can be upscaled entirely on-device. The model downloads lazily on first AI run and caches locally; a high-quality canvas-resample fallback is used automatically when WebAssembly is unavailable. No Helvety-hosted image conversion in the normal flow, and very large exports may be clamped to fit each browser’s canvas limits.",
    sections: [
      {
        heading: "Access model",
        kind: "paragraph",
        body: "Launch the tool without signing in. Usage stays free; automated safeguards keep abusive floods from degrading shared infrastructure.",
      },
      {
        heading: "Operator knobs",
        kind: "bullets",
        items: [
          "Use the built-in Real-ESRGAN AI engine by default, with canvas resampling only as an automatic fallback for browsers that cannot run WebAssembly.",
          "Pick a fixed multiplier (2×, 4×) or clamp to a target width or height.",
          "Batch up to five files per run, downloading individually or all together once ready.",
          "Mind the in-app caps: 32 MP for the canvas fallback, 4 MP per image for AI upscaling (Float32 stitching buffers fit comfortably in a worker).",
        ],
      },
      {
        heading: "Why it fits sensitive screenshots",
        kind: "paragraph",
        body: "Frames never leave your session in the supported pipeline, including the AI flow, which makes it easier to audit your own asset workflow when polishing marketing shots or reference stills.",
      },
    ],
  },
  type: "saas",
  category: "utilities",
  status: "available",
  image: productArtwork.artwork2,
  artist: "Alexandre Calame",
  features: [
    "On-device AI super-resolution (Real-ESRGAN via onnxruntime-web)",
    "WebGPU acceleration with automatic WASM fallback",
    "Lazy model download cached locally (works offline after first run)",
    "Tiled inference with linear-blend stitching for seam-free output",
    "Automatic canvas-resample fallback for browsers without WebAssembly",
    "2× and 4× scale presets",
    "Target width/height mode with preserved aspect ratio",
    "Batch processing (up to 5 images)",
    "No login or account required",
    "Dark & light mode support",
  ],
  pricing: {
    hasFreeTier: true,
    hasYearlyPricing: false,
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
    platforms: ["Web"],
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
    releaseDate: "2026-04-28",
  },
};

// =============================================================================
// HELVETY TASKS
// =============================================================================

/**
 * Helvety Tasks - E2E Encrypted Task Management
 */
const helvetyTasks: SaaSProduct = {
  id: "helvety-tasks",
  slug: "helvety-tasks",
  name: "Helvety Tasks",
  shortDescription:
    "Stage-aware task board with at-rest encryption for titles, descriptions, and schedule fields—plus labels, priority, and optional Helvety Contacts links.",
  description: {
    intro:
      "Helvety Tasks pairs a kanban-style spine with real encryption: sensitive fields leave your browser only after WebCrypto transforms them, so the server stores ciphertext tied to passkey-derived keys you control.",
    sections: [
      {
        heading: "Pricing reality",
        kind: "paragraph",
        body: "Every productivity feature ships at no charge—no upgrade tiers, subscription packaging, or per-seat business gatekeeping.",
      },
      {
        heading: "How work flows",
        kind: "bullets",
        items: [
          "Immutable Helvety stages keep everyone aligned on meaning (from backlog through acceptance and The Void).",
          "Labels and priority live in the detail sheet while the board stays readable for status at a glance.",
          "Rich descriptions carry headings, lists, and inline links without breaking the encryption envelope.",
          "Link Helvety Contacts when both apps support the relationship metadata.",
        ],
      },
      {
        heading: "Data protection",
        kind: "paragraph",
        body: "Processing is subject to applicable Swiss data protection law where it applies, including the revised Federal Act on Data Protection (nDSG). Under the current encrypted-field architecture, Helvety is not intended to receive usable keys for encrypted task body fields.",
      },
    ],
  },
  type: "saas",
  category: "productivity",
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
    hasYearlyPricing: false,
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
    platforms: ["Web"],
    keywords: [
      "tasks",
      "project management",
      "encrypted",
      "e2e",
      "privacy",
      "productivity",
    ],
    featured: true,
    releaseDate: "2025-11-11",
  },
};

// =============================================================================
// HELVETY CONTACTS
// =============================================================================

/**
 * Helvety Contacts - E2E Encrypted Contact Management
 */
const helvetyContacts: SaaSProduct = {
  id: "helvety-contacts",
  slug: "helvety-contacts",
  name: "Helvety Contacts",
  shortDescription:
    "Names, numbers, birthdays, and rich notes—encrypted at rest with Personal, Work, and Other buckets, drag reorder, and self-service export.",
  description: {
    intro:
      "Helvety Contacts is a lightweight encrypted Rolodex: structured fields stay opaque to us because encryption happens locally before anything syncs.",
    sections: [
      {
        heading: "Pricing reality",
        kind: "paragraph",
        body: "The full address book experience is free—no premium tier hiding CSV export or multi-category sorting.",
      },
      {
        heading: "Everyday ergonomics",
        kind: "bullets",
        items: [
          "Rich-text notes behave like miniature documents with headings and lists.",
          "Drag-and-drop ordering within a category or across categories keeps tactile muscle memory.",
          "Self-service encrypted export spells out the on-disk format inside the wizard.",
          "Hook tasks to contacts whenever both apps expose the shared linking primitives.",
        ],
      },
      {
        heading: "Data protection",
        kind: "paragraph",
        body: "Processing is subject to applicable Swiss data protection law where it applies, including the revised Federal Act on Data Protection (nDSG). Helvety does not hold keys to your encrypted contact payloads.",
      },
    ],
  },
  type: "saas",
  category: "productivity",
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
    hasYearlyPricing: false,
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
    platforms: ["Web"],
    keywords: [
      "contacts",
      "address book",
      "encrypted",
      "e2e",
      "privacy",
      "crm",
    ],
    featured: true,
    releaseDate: "2025-12-02",
  },
};

// =============================================================================
// HELVETY NOTES
// =============================================================================

/**
 * Helvety Notes - E2E Encrypted Notes
 */
const helvetyNotes: SaaSProduct = {
  id: "helvety-notes",
  slug: "helvety-notes",
  name: "Helvety Notes",
  shortDescription:
    "Encrypted title-and-body notes in Personal, Work, and Other buckets, with rich text and cross-links to tasks or contacts when you use those apps.",
  description: {
    intro:
      "Helvety Notes keeps capture friction low: every record is a title plus an optional long-form description, both encrypted client-side before hitting storage.",
    sections: [
      {
        heading: "Pricing reality",
        kind: "paragraph",
        body: "Same gratis stance as the rest of the Helvety productivity trio—no metering on categories, linking, or editors.",
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
        body: "Processing is subject to applicable Swiss data protection law where it applies, including the revised Federal Act on Data Protection (nDSG). Helvety does not hold keys to your encrypted note content.",
      },
    ],
  },
  type: "saas",
  category: "productivity",
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
    hasYearlyPricing: false,
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
    platforms: ["Web"],
    keywords: [
      "notes",
      "encrypted",
      "e2e",
      "privacy",
      "knowledge",
      "productivity",
    ],
    featured: true,
    releaseDate: "2026-01-20",
  },
};

// =============================================================================
// ALL PRODUCTS
// =============================================================================

/**
 * All available products
 */
/** Source order matches oldest → newest (see {@link PRODUCT_RELEASE_TIE_PRIORITY}). */
const products: Product[] = [
  helvetyPdf,
  helvetyExplorer,
  helvetyTasks,
  helvetyContacts,
  helvetyNotes,
  powerAutomateForceV3False,
  helvetyScreenTools,
  helvetyImageUpscaler,
];

// =============================================================================
// DATA ACCESS FUNCTIONS
// =============================================================================

/**
 * Get all products
 */
export function getAllProducts(): Product[] {
  return [...products].sort(compareProductsByReleaseDateNewestFirst);
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
  let filtered = [...products];

  // Filter by type
  if (filters.type && filters.type !== "all") {
    filtered = filtered.filter((product) => product.type === filters.type);
  }

  // Filter by category
  if (filters.category && filters.category !== "all") {
    filtered = filtered.filter(
      (product) => product.category === filters.category
    );
  }

  // Filter by status
  if (filters.status) {
    filtered = filtered.filter((product) => product.status === filters.status);
  }

  // Filter by featured
  if (filters.featured) {
    filtered = filtered.filter(
      (product) => product.metadata?.featured === true
    );
  }

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.shortDescription.toLowerCase().includes(searchLower) ||
        productDescriptionToPlainText(product.description)
          .toLowerCase()
          .includes(searchLower)
    );
  }

  // Sort
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          const aPrice = a.pricing.tiers[0]?.price ?? 0;
          const bPrice = b.pricing.tiers[0]?.price ?? 0;
          comparison = aPrice - bPrice;
          break;
        case "releaseDate":
          comparison = compareProductsByReleaseDateOldestFirst(a, b);
          break;
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });
  } else {
    filtered.sort(compareProductsByReleaseDateNewestFirst);
  }

  return filtered;
}

/**
 * Static product data for the Store app (@helvety/store)
 */

import type {
  Product,
  SaaSProduct,
  SoftwareProduct,
  ProductFilters,
} from "@/lib/types/products";

/**
 * Catalog default sort is newest `releaseDate` first. Release dates are chosen to
 * reflect product age (not repo history). Intended chronological order, oldest → newest:
 *   PDF → SPO Explorer → Tasks → Contacts → Notes → Power Automate Browser Extension
 *
 * When two products share the same `metadata.releaseDate`, higher number sorts first
 * (treated as newer for display).
 */
const PRODUCT_RELEASE_TIE_PRIORITY: Record<string, number> = {
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

/** Oldest `releaseDate` first; pairs with sortOrder like other sortBy fields. */
function compareProductsByReleaseDateOldestFirst(
  a: Product,
  b: Product
): number {
  return compareProductsByReleaseDateNewestFirst(b, a);
}

// =============================================================================
// PRODUCT DATA
// =============================================================================
// Store artwork is served from apps/store/public and referenced with the
// store basePath (e.g. "/store/artwork_1.png").

/**
 * Helvety SPO Explorer - SharePoint Online Extension
 */
const helvetyExplorer: SoftwareProduct = {
  id: "helvety-spo-explorer",
  slug: "helvety-spo-explorer",
  name: "Helvety SPO Explorer",
  shortDescription:
    "A privacy-focused SharePoint site navigator. Browse, search, and favorite sites you can access. Favorites and settings stay on your device.",
  image: "/store/artwork_1.png",
  artist: "Alexandre Calame",
  description: `Helvety SPO Explorer is a SharePoint Framework (SPFx) application customizer that adds fast site navigation inside Microsoft 365. For the flows it supports, work runs in the browser; favorites and settings stay on the device (for example in localStorage).

Access — The solution is free to use and open source. IT deploys it from the tenant App Catalog; users need appropriate Microsoft 365 permissions to see their sites. No separate Helvety account is required.

Key features:
• Site discovery — list SharePoint sites you can access
• Search — filter by title, description, and URL with highlighted matches
• Favorites and quick access — pin sites and open them from the header control
• Settings — adjust URL display, descriptions, tab behavior, and related options
• SharePoint themes — follows light and dark modes where the host page supports them
• Accessibility — keyboard navigation and layouts aimed at common SharePoint pages
• Performance — caching and efficient UI rendering (details depend on the build you run)

The control appears on supported modern pages that use the standard shell; it does not show on every SharePoint surface. See the GitHub README for page coverage, deployment steps, and update notes.`,
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
          "Sign in as a SharePoint Administrator and go to your organization’s tenant App Catalog—the central catalog for the whole Microsoft 365 tenant, not a site collection–only catalog. If you do not have one yet, create it from the SharePoint admin center (Apps → App catalog) per Microsoft guidance.",
      },
      {
        title: "Upload the .sppkg",
        description:
          "In the App Catalog site, open the Apps for SharePoint library (or equivalent), upload the .sppkg file, then choose Deploy when prompted so the solution is trusted for your tenant.",
      },
      {
        title: "Enable for all sites (recommended)",
        description:
          "When you enable the app, select the option to enable it and add it to all sites (tenant-wide). That registers the application customizer so users do not need a per-site “Add an app” install. Updates: when deploying a newer version, you can leave “add to all sites” unchecked to avoid duplicate Tenant Wide Extensions entries—the existing registration keeps using the updated package.",
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
          "On a modern SharePoint site page that uses the standard shell and Top placeholder (for example a communication or team site home page), look for the “Sites you have access to” control in the top area. It does not appear on classic pages, on every list or library view, or on some specialized modern pages—see the project README on GitHub for details.",
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
 * Power Automate browser extension — forces v3=false for classic Power Automate editor URLs
 */
const powerAutomateForceV3False: SoftwareProduct = {
  id: "helvety-power-automate-force-v3-false",
  slug: "helvety-power-automate-force-v3-false",
  name: "Power Automate Browser Extension",
  shortDescription:
    "A minimal Edge/Chrome extension that keeps Power Automate flow and run URLs on the classic editor by ensuring v3=false. Runs only on make.powerautomate.com.",
  image: "/store/artwork_6.png",
  artist: "Rudolf Koller",
  description: `Power Automate Browser Extension is a small Manifest V3 extension for Microsoft Edge and Google Chrome. It only runs on https://make.powerautomate.com/ and adjusts URLs whose path contains /flows/ or /runs/ so they use v3=false, which keeps the classic Power Automate editor loading consistently.

It adds v3=false when the parameter is missing and replaces v3=true when present. It relies on history.replaceState and History API hooks so behavior applies on first load, refresh, back/forward, and typical client-side navigation inside Power Automate.

Access — Free and open source. No Helvety account is needed. Download the packaged ZIP from this Store page and install it with your browser’s developer mode; source and issues live on GitHub.

Key features:
• Scoped host — only make.powerautomate.com
• URL rules — targets /flows/ and /runs/ paths
• SPA-friendly — not limited to full page loads
• Manifest V3 — current Edge and Chrome extension model

Microsoft may change Power Automate URLs or the editor over time; confirm behavior against the build you install and the vendor’s current documentation.`,
  type: "software",
  category: "integrations",
  status: "available",
  features: [
    "Scoped to make.powerautomate.com only",
    "Forces v3=false on /flows/ and /runs/ URLs",
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
          "Unzip the file into a folder you can keep permanently (for example under Documents). Chromium requires a real folder on disk—you cannot point “Load unpacked” at the ZIP file itself.",
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
          "Click Load unpacked and select the extracted folder—the one that contains manifest.json (not a parent directory).",
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
    "A privacy-focused, client-side PDF toolkit. Merge, reorder, rotate, and extract pages from PDF files and images. Browser-based processing for supported operations.",
  description: `Helvety PDF is a browser-based PDF toolkit. For the operations it supports, files are handled in your browser and are not uploaded to Helvety for processing.

Access — Free to use with no account. Ordinary technical limits may still apply to keep the app reliable (for example per-file size caps or rate safeguards).

Key features:
• Merge — combine multiple PDFs and images into one document
• Reorder — drag-and-drop thumbnails to change page order
• Rotate — turn pages in 90° steps
• Extract and delete — pull out single pages or remove them from a document
• Images — PNG, JPEG, WebP, and GIF alongside PDFs

Each file can be up to 100 MB. How large or complex a job your device can finish depends on your browser and hardware.`,
  type: "saas",
  category: "utilities",
  status: "available",
  image: "/store/artwork_2.png",
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
    "A privacy-focused task management app with client-side encryption for sensitive fields. Task list grouped by built-in stages with labels and priority in task details.",
  description: `Helvety Tasks is a task app with end-to-end encryption: sensitive task fields are encrypted in your browser before they are stored.

Access — Free to use. There are no paid tiers, subscriptions, or business usage caps.

Key features:
• Encryption — sensitive content is protected with your passkey; Helvety cannot read those fields in plaintext
• Workflow — main list grouped by fixed stages (for example Backlog, Discovery, Ready, In Progress, Testing, Acceptance, Completed, The Void); labels and priority are set in task details
• Rich text — headings, lists, links, and formatting in descriptions
• Labels and priority — set in the task detail sheet; color-coded in the editor (main list shows title and description)
• Helvety Contacts — link contacts to tasks where the apps support it
• Reorder — drag and drop within and between stages

Data protection — Processing is subject to applicable Swiss data protection law where it applies, including the revised Federal Act on Data Protection (nDSG). Helvety does not hold keys to your encrypted content.`,
  type: "saas",
  category: "productivity",
  status: "available",
  image: "/store/artwork_3.png",
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
    "A privacy-focused contact management app with client-side encryption for sensitive fields. Store names, emails, phone numbers, birthdays, and notes.",
  description: `Helvety Contacts is a contact manager with end-to-end encryption: sensitive contact fields are encrypted in your browser before they are stored.

Access — Free to use. There are no paid tiers, subscriptions, or business usage caps.

Key features:
• Encryption — sensitive content is protected with your passkey; Helvety cannot read those fields in plaintext
• Fields — names, description, email, phone, birthday, and notes
• Rich text — formatted notes with headings, lists, and links
• Categories — fixed set: Personal, Family, Work, Business, Other
• Helvety Tasks — link tasks to contacts where the apps support it
• Reorder — drag and drop within and between categories
• Export — self-service export for backup and portability; the in-app flow shows the current format and steps

Data protection — Processing is subject to applicable Swiss data protection law where it applies, including the revised Federal Act on Data Protection (nDSG). Helvety does not hold keys to your encrypted content.`,
  type: "saas",
  category: "productivity",
  status: "available",
  image: "/store/artwork_4.png",
  artist: "Ferdinand Hodler",
  features: [
    "End-to-end encryption for sensitive contact fields",
    "Rich contact fields (name, email, phone, birthday)",
    "Rich text notes with formatting",
    "Immutable built-in categories (Personal, Family, Work, Business, Other)",
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
    "A privacy-focused notes app with client-side encryption for sensitive fields. Title and description notes grouped by Personal, Work, and Other.",
  description: `Helvety Notes is a notes app with end-to-end encryption: sensitive note fields are encrypted in your browser before they are stored.

Access — Free to use. There are no paid tiers, subscriptions, or business usage caps.

Key features:
• Encryption — sensitive content is protected with your passkey; Helvety cannot read those fields in plaintext
• Structure — each note has a title and description; the list is grouped by category (Personal, Work, Other)
• Rich text — headings, lists, links, and formatting in descriptions
• Helvety Tasks and Contacts — cross-link where the apps support it
• Reorder — drag and drop within and between categories

Data protection — Processing is subject to applicable Swiss data protection law where it applies, including the revised Federal Act on Data Protection (nDSG). Helvety does not hold keys to your encrypted content.`,
  type: "saas",
  category: "productivity",
  status: "available",
  image: "/store/artwork_5.png",
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
        product.description.toLowerCase().includes(searchLower)
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
        case "sortOrder":
          const aOrder = a.metadata?.sortOrder ?? 999;
          const bOrder = b.metadata?.sortOrder ?? 999;
          comparison = aOrder - bOrder;
          break;
        case "createdAt":
          comparison = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
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

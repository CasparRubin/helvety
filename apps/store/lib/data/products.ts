/**
 * Static product data for the Store app (@helvety/store)
 */

import type {
  Product,
  SaaSProduct,
  SoftwareProduct,
  ProductFilters,
  ProductType,
} from "@/lib/types/products";

// =============================================================================
// PRODUCT DATA
// =============================================================================

/**
 * Helvety SPO Explorer - SharePoint Online Extension
 */
export const helvetyExplorer: SoftwareProduct = {
  id: "helvety-spo-explorer",
  slug: "helvety-spo-explorer",
  name: "Helvety SPO Explorer",
  shortDescription:
    "A privacy-focused SharePoint site navigator. Browse, search, and favorite accessible sites with a lightning-fast interface. Preferences are stored locally in the current design.",
  image: "/store/artwork_1.jpg",
  artist: "Alexandre Calame",
  description: `Helvety SPO Explorer is a privacy-focused SharePoint Framework (SPFx) application customizer that gives you a fast way to navigate your Microsoft 365 environment.

Privacy First - In the current design, data processing happens client-side for supported flows. User preferences (favorites and settings) are stored locally in the browser's localStorage.

Key Features:
• Site Discovery - Automatically fetches and displays all SharePoint sites you have access to
• Real-time Search - Search across site titles, descriptions, and URLs with highlighted matches
• Favorites Management - Mark frequently used sites as favorites for quick access
• Quick Access Menu - Dropdown menu from the navbar button showing your favorite sites
• Settings Panel - Customize display preferences including URL display, descriptions, and tab behavior

The extension adapts to SharePoint's light and dark themes, with full keyboard navigation and accessibility support. Performance is optimized with 5-minute caching and efficient React rendering.

Install it once in your SharePoint App Catalog and give all users instant access to a clean, modern navigation experience.`,
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
          "Currently available at no cost",
        ],
      },
    ],
  },
  links: {
    github: "https://github.com/CasparRubin/helvety-spo-explorer",
  },
  software: {
    fileFormat: "sppkg",
    requirements: [
      "SharePoint Online",
      "Microsoft 365 subscription",
      "SharePoint Administrator role (for installation)",
    ],
    licenseType: "free",
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
    sortOrder: 2,
  },
};

// =============================================================================
// HELVETY PDF
// =============================================================================

/**
 * Helvety PDF - PDF Toolkit
 */
export const helvetyPdf: SaaSProduct = {
  id: "helvety-pdf",
  slug: "helvety-pdf",
  name: "Helvety PDF",
  shortDescription:
    "A privacy-focused, client-side PDF toolkit. Merge, reorder, rotate, and extract pages from PDF files and images. Browser-based processing for supported operations.",
  description: `Helvety PDF is a privacy-focused PDF toolkit that runs in your browser for supported operations. File content is processed client-side and is not uploaded to Helvety servers for processing.

Pricing and Limits - Helvety PDF is currently available at no cost with no account required. Limits and pricing may change over time.

Key Features:
• Multi-file Merging - Combine multiple PDF files and images into a single document
• Page Reordering - Drag and drop to rearrange pages visually with thumbnail previews
• Page Rotation - Rotate individual pages by 90° increments
• Page Extraction - Extract individual pages as separate PDF files
• Page Deletion - Remove unwanted pages from your documents
• Image Support - Upload and convert images (PNG, JPEG, WebP, GIF) alongside PDF files

No login or account is required. Files are limited to 100MB each, and practical throughput depends on browser/device resources.`,
  type: "saas",
  category: "utilities",
  status: "available",
  image: "/store/artwork_2.jpg",
  artist: "Rudolf Koller",
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
          "Currently available at no cost",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/pdf",
  },
  saas: {
    appUrl: "https://helvety.com/pdf",
    trialDays: 0,
    trialRequiresCard: false,
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
    sortOrder: 3,
  },
};

// =============================================================================
// HELVETY TASKS
// =============================================================================

/**
 * Helvety Tasks - E2E Encrypted Task Management
 */
export const helvetyTasks: SaaSProduct = {
  id: "helvety-tasks",
  slug: "helvety-tasks",
  name: "Helvety Tasks",
  shortDescription:
    "A privacy-focused task management app with client-side encryption for sensitive fields. Organize tasks in a flat workflow with built-in stages and labels.",
  description: `Helvety Tasks is an end-to-end encrypted task management app where sensitive content is encrypted client-side before storage.

Pricing and Limits - Helvety Tasks is currently available at no cost. Limits and pricing may change over time.

Key Features:
• End-to-End Encryption - Sensitive task content is encrypted using your passkey
• Flat Task Workflow - Manage tasks in one list with immutable built-in stages and labels
• Rich Text Descriptions - Full formatting toolbar with headings, lists, and links
• Stage Management - Immutable built-in workflow stages with consistent colors and icons (Backlog, Discovery, Ready, In Progress, Testing, Acceptance, Completed, The Void)
• Label & Priority System - Categorize and prioritize tasks with color-coded indicators
• Contact Linking - Link contacts from Helvety Contacts directly to tasks
• Drag & Drop - Reorder tasks within and between stages

Your data is protected under applicable Swiss data protection law (including nDSG where applicable). Helvety does not have decryption keys and cannot read encrypted task content in plaintext.`,
  type: "saas",
  category: "productivity",
  status: "available",
  image: "/store/artwork_3.jpg",
  artist: "Rudolf Koller",
  features: [
    "End-to-end encryption for sensitive task content fields",
    "Flat task workflow with stages and labels",
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
          "Up to 250 tasks per account",
          "Currently available at no cost",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/tasks",
  },
  saas: {
    appUrl: "https://helvety.com/tasks",
    trialDays: 0,
    trialRequiresCard: false,
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
    sortOrder: 4,
  },
};

// =============================================================================
// HELVETY CONTACTS
// =============================================================================

/**
 * Helvety Contacts - E2E Encrypted Contact Management
 */
export const helvetyContacts: SaaSProduct = {
  id: "helvety-contacts",
  slug: "helvety-contacts",
  name: "Helvety Contacts",
  shortDescription:
    "A privacy-focused contact management app with client-side encryption for sensitive fields. Store names, emails, phone numbers, birthdays, and notes.",
  description: `Helvety Contacts is an end-to-end encrypted contact management app. Sensitive contact data is encrypted client-side before storage.

Pricing and Limits - Helvety Contacts is currently available at no cost. Limits and pricing may change over time.

Key Features:
• End-to-End Encryption - Sensitive contact content is encrypted using your passkey
• Rich Contact Fields - Store first name(s), last name(s), description, email, phone, birthday, and notes
• Rich Text Notes - Full formatting toolbar for structured note editing
• Category Management - Organize contacts with immutable built-in categories (Personal, Family, Work, Business, Other)
• Task Linking - Link tasks from Helvety Tasks directly on contacts
• Drag & Drop - Rearrange contacts within and between categories
• Data Export - Export all your contacts as a decrypted JSON file (supports nDSG Art. 28 data portability requests)

Your contacts are protected under applicable Swiss data protection law (including nDSG where applicable). Helvety does not have decryption keys and cannot read encrypted contact content in plaintext.`,
  type: "saas",
  category: "productivity",
  status: "available",
  image: "/store/artwork_4.jpg",
  artist: "Alexandre Calame",
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
          "Up to 250 contacts per user",
          "Rich text notes",
          "Currently available at no cost",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/contacts",
  },
  saas: {
    appUrl: "https://helvety.com/contacts",
    trialDays: 0,
    trialRequiresCard: false,
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
    sortOrder: 5,
  },
};

// =============================================================================
// HELVETY NOTES
// =============================================================================

/**
 * Helvety Notes - E2E Encrypted Notes
 */
export const helvetyNotes: SaaSProduct = {
  id: "helvety-notes",
  slug: "helvety-notes",
  name: "Helvety Notes",
  shortDescription:
    "A privacy-focused notes app with client-side encryption for sensitive fields. Keep title and description notes in one clean list.",
  description: `Helvety Notes is an end-to-end encrypted notes app where sensitive note content is encrypted client-side before storage.

Pricing and Limits - Helvety Notes is currently available at no cost. Limits and pricing may change over time.

Key Features:
• End-to-End Encryption - Sensitive note content is encrypted using your passkey
• Simple Notes Model - Every note has a title and description in one flat list
• Rich Text Descriptions - Full formatting toolbar with headings, lists, and links
• Cross-Linking - Link notes with Helvety Tasks and Helvety Contacts
• Drag & Drop - Reorder notes quickly

Your data is protected under applicable Swiss data protection law (including nDSG where applicable). Helvety does not have decryption keys and cannot read encrypted note content in plaintext.`,
  type: "saas",
  category: "productivity",
  status: "available",
  image: "/store/artwork_4.jpg",
  artist: "Alexandre Calame",
  features: [
    "End-to-end encryption for sensitive note content",
    "Simple note model (title + description)",
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
          "Up to 250 notes per user",
          "Currently available at no cost",
        ],
      },
    ],
  },
  links: {
    website: "https://helvety.com/notes",
  },
  saas: {
    appUrl: "https://helvety.com/notes",
    trialDays: 0,
    trialRequiresCard: false,
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
    sortOrder: 6,
  },
};

// =============================================================================
// ALL PRODUCTS
// =============================================================================

/**
 * All available products
 */
export const products: Product[] = [
  helvetyExplorer,
  helvetyPdf,
  helvetyTasks,
  helvetyContacts,
  helvetyNotes,
];

// =============================================================================
// DATA ACCESS FUNCTIONS
// =============================================================================

/**
 * Get all products
 */
export function getAllProducts(): Product[] {
  return products;
}

/**
 * Get a product by its slug
 * @param slug
 */
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

/**
 * Get a product by its ID
 * @param id
 */
export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
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
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });
  } else {
    // Default sort by sortOrder
    filtered.sort((a, b) => {
      const aOrder = a.metadata?.sortOrder ?? 999;
      const bOrder = b.metadata?.sortOrder ?? 999;
      return aOrder - bOrder;
    });
  }

  return filtered;
}

/**
 * Get all unique product types
 */
export function getProductTypes(): ProductType[] {
  const types = new Set(products.map((product) => product.type));
  return Array.from(types);
}

/**
 * Get featured products
 */
export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.metadata?.featured === true);
}

/**
 * Static product data for helvety-store
 */

import type {
  Product,
  SoftwareProduct,
  ProductFilters,
  ProductType,
} from "@/lib/types/products";

// =============================================================================
// PRODUCT DATA
// =============================================================================

/**
 * Helvety PDF - Software subscription product
 */
export const helvetyPdf: SoftwareProduct = {
  id: "helvety-pdf",
  slug: "helvety-pdf",
  name: "Helvety PDF",
  shortDescription:
    "A privacy-focused PDF toolkit that runs entirely in your browser. Merge, reorder, rotate, and extract pages from PDFs and images. Everything runs locally in your browser.",
  description: `Helvety PDF is a privacy-focused, client-side PDF toolkit. All file processing happens entirely in your browser. Your files never leave your device.

Upload PDF files and images (PNG, JPEG, WebP, GIF), preview page thumbnails, and manage your documents with an intuitive drag-and-drop interface. Merge multiple files into one PDF, extract individual pages, rotate pages by 90° increments, delete unwanted pages, and reorder with ease.

The customizable grid layout lets you adjust the view to accommodate different page sizes. With dark and light mode support, you can work comfortably in any environment.

Note: While your files never leave your device, the hosting provider may collect standard connection metadata.`,
  type: "software",
  category: "productivity",
  status: "available",
  icon: "FileText",
  features: [
    "PDF and image support (PNG, JPEG, WebP, GIF)",
    "Merge multiple files into one PDF",
    "Extract individual pages as separate PDFs",
    "Rotate pages by 90° increments",
    "Reorder pages with drag-and-drop",
    "Delete unwanted pages",
    "Page thumbnail previews",
    "Customizable grid layout",
    "100% client-side processing",
    "Dark and light mode support",
  ],
  pricing: {
    hasFreeTier: true,
    hasYearlyPricing: false,
    tiers: [
      {
        id: "helvety-pdf-free",
        name: "Basic",
        price: 0,
        currency: "CHF",
        interval: "monthly",
        isFree: true,
        features: [
          "Upload maximal 2 Files",
          "Maximum 10 pages",
          "Merge Files",
          "Split Files",
          "Reorder pages",
          "Rotate pages",
          "Client-side processing",
        ],
      },
      {
        id: "helvety-pdf-pro-monthly",
        name: "Pro",
        price: 495,
        currency: "CHF",
        interval: "monthly",
        highlighted: true,
        stripePriceId: process.env.STRIPE_HELVETY_PDF_PRO_MONTHLY_PRICE_ID,
        features: [
          "No File Upload Limit",
          "No page limits",
          "Merge Files",
          "Split Files",
          "Reorder pages",
          "Rotate pages",
          "Client-side processing",
          "Only limited by your device",
        ],
      },
    ],
  },
  links: {
    website: "https://pdf.helvety.com",
    github: "https://github.com/CasparRubin/helvety-pdf",
  },
  software: {
    downloadUrl: "https://pdf.helvety.com",
    requirements: ["Google Chrome 128+", "Microsoft Edge 128+", "Safari 18+"],
    licenseType: "subscription",
  },
  media: {
    screencaptures: [
      {
        src: "https://pdf.helvety.com/screencapture/demo.gif",
        alt: "Helvety PDF Demo - Drag and drop PDF management",
        type: "gif",
      },
    ],
    screenshots: [
      {
        src: "https://pdf.helvety.com/screenshots/Light%20mode.png",
        alt: "Helvety PDF - Light mode",
        type: "image",
      },
      {
        src: "https://pdf.helvety.com/screenshots/Dark%20mode.png",
        alt: "Helvety PDF - Dark mode",
        type: "image",
      },
      {
        src: "https://pdf.helvety.com/screenshots/Light%20mode%20Functionality.png",
        alt: "Helvety PDF - Light mode with functionality",
        type: "image",
      },
      {
        src: "https://pdf.helvety.com/screenshots/Dark%20mode%20Functionality.png",
        alt: "Helvety PDF - Dark mode with functionality",
        type: "image",
      },
      {
        src: "https://pdf.helvety.com/screenshots/Dark%20mode%20Mobile%20Functionality.png",
        alt: "Helvety PDF - Mobile view",
        type: "image",
      },
    ],
  },
  metadata: {
    targetAudience: ["professionals", "students", "privacy-conscious users"],
    platforms: ["web"],
    keywords: ["pdf", "merge", "split", "privacy", "browser"],
    featured: true,
    sortOrder: 1,
  },
};

/**
 * Helvety SPO Explorer - SharePoint Online Extension
 */
export const helvetyExplorer: SoftwareProduct = {
  id: "helvety-spo-explorer",
  slug: "helvety-spo-explorer",
  name: "Helvety SPO Explorer",
  shortDescription:
    "A privacy-focused SharePoint site navigator. Browse, search, and favorite all your accessible sites with a lightning-fast interface. All preferences stored locally - no external data collection.",
  description: `Helvety SPO Explorer is a privacy-focused SharePoint Framework (SPFx) application customizer that transforms how you navigate your Microsoft 365 environment.

Privacy First - All data processing happens client-side. User preferences (favorites and settings) are stored locally in the browser's localStorage. The application does not collect or transmit user data to external servers.

Key Features:
• Site Discovery - Automatically fetches and displays all SharePoint sites you have access to
• Real-time Search - Search across site titles, descriptions, and URLs with highlighted matches
• Favorites Management - Mark frequently used sites as favorites for quick access
• Quick Access Menu - Dropdown menu from the navbar button showing your favorite sites
• Settings Panel - Customize display preferences including URL display, descriptions, and tab behavior

The extension seamlessly adapts to SharePoint's light and dark themes, with full keyboard navigation and accessibility support. Performance is optimized with 5-minute caching and efficient React rendering.

Install it once in your SharePoint App Catalog and give all users instant access to a clean, modern navigation experience.`,
  type: "software",
  category: "integrations",
  status: "available",
  icon: "LayoutGrid",
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
    hasFreeTier: false,
    hasYearlyPricing: false,
    tiers: [
      {
        id: "helvety-spo-explorer-basic-monthly",
        name: "Solo",
        price: 45000,
        currency: "CHF",
        interval: "monthly",
        features: [
          "Full extension features",
          "All sites navigation",
          "Favorites and quick access",
          "Settings customization",
          "Updates included with subscription",
        ],
      },
      {
        id: "helvety-spo-explorer-enterprise-monthly",
        name: "Supported",
        price: 65000,
        currency: "CHF",
        interval: "monthly",
        highlighted: true,
        features: [
          "Full extension features",
          "All sites navigation",
          "Favorites and quick access",
          "Settings customization",
          "Updates included with subscription",
          "Priority support",
          "Dedicated setup assistance",
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
    licenseType: "subscription",
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
// ALL PRODUCTS
// =============================================================================

/**
 * All available products
 */
export const products: Product[] = [helvetyPdf, helvetyExplorer];

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

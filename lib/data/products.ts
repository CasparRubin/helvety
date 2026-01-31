/**
 * Static product data for helvety-store
 * This will eventually be moved to a database
 */

import type {
  Product,
  SoftwareProduct,
  ProductFilters,
  ProductType,
} from '@/lib/types/products'

// =============================================================================
// PRODUCT DATA
// =============================================================================

/**
 * Helvety PDF - Software subscription product
 */
export const helvetyPdf: SoftwareProduct = {
  id: 'helvety-pdf',
  slug: 'helvety-pdf',
  name: 'Helvety PDF',
  shortDescription:
    'A privacy-focused PDF toolkit that runs entirely in your browser. Merge, reorder, rotate, and extract pages from PDFs and images. Everything runs locally in your browser.',
  description: `Helvety PDF is a privacy-focused, client-side PDF toolkit. All file processing happens entirely in your browser. Your files never leave your device.

Upload PDF files and images (PNG, JPEG, WebP, GIF), preview page thumbnails, and manage your documents with an intuitive drag-and-drop interface. Merge multiple files into one PDF, extract individual pages, rotate pages by 90° increments, delete unwanted pages, and reorder with ease.

The customizable grid layout lets you adjust the view to accommodate different page sizes. With dark and light mode support, you can work comfortably in any environment.

Note: While your files never leave your device, the hosting provider may collect standard connection metadata.`,
  type: 'software',
  category: 'productivity',
  status: 'available',
  icon: 'FileText',
  features: [
    'PDF and image support (PNG, JPEG, WebP, GIF)',
    'Merge multiple files into one PDF',
    'Extract individual pages as separate PDFs',
    'Rotate pages by 90° increments',
    'Reorder pages with drag-and-drop',
    'Delete unwanted pages',
    'Page thumbnail previews',
    'Customizable grid layout',
    '100% client-side processing',
    'Dark and light mode support',
  ],
  pricing: {
    hasFreeTier: true,
    hasYearlyPricing: false,
    tiers: [
      {
        id: 'helvety-pdf-free',
        name: 'Basic',
        price: 0,
        currency: 'CHF',
        interval: 'monthly',
        isFree: true,
        features: [
          'Upload maximal 2 Files',
          'Maximum 5 pages',
          'Merge Files',
          'Split Files',
          'Reorder pages',
          'Client-side processing',
        ],
      },
      {
        id: 'helvety-pdf-pro-monthly',
        name: 'Pro',
        price: 495,
        currency: 'CHF',
        interval: 'monthly',
        highlighted: true,
        stripePriceId: process.env.STRIPE_HELVETY_PDF_PRO_MONTHLY_PRICE_ID,
        features: [
          'No File Upload Limit',
          'No page limits',
          'Merge Files',
          'Split Files',
          'Reorder pages',
          'Rotate pages',
          'Client-side processing',
          'Only limited by your device',
        ],
      },
    ],
  },
  links: {
    website: 'https://pdf.helvety.com',
    github: 'https://github.com/AugiLabs/helvety-pdf',
  },
  software: {
    downloadUrl: 'https://pdf.helvety.com',
    requirements: ['Modern web browser (Chrome, Firefox, Safari, Edge)'],
    licenseType: 'subscription',
  },
  media: {
    screencaptures: [
      {
        src: 'https://pdf.helvety.com/screencapture/demo.gif',
        alt: 'Helvety PDF Demo - Drag and drop PDF management',
        type: 'gif',
      },
    ],
    screenshots: [
      {
        src: 'https://pdf.helvety.com/screenshots/Light%20mode.png',
        alt: 'Helvety PDF - Light mode',
        type: 'image',
      },
      {
        src: 'https://pdf.helvety.com/screenshots/Dark%20mode.png',
        alt: 'Helvety PDF - Dark mode',
        type: 'image',
      },
      {
        src: 'https://pdf.helvety.com/screenshots/Light%20mode%20Functionality.png',
        alt: 'Helvety PDF - Light mode with functionality',
        type: 'image',
      },
      {
        src: 'https://pdf.helvety.com/screenshots/Dark%20mode%20Functionality.png',
        alt: 'Helvety PDF - Dark mode with functionality',
        type: 'image',
      },
      {
        src: 'https://pdf.helvety.com/screenshots/Dark%20mode%20Mobile%20Functionality.png',
        alt: 'Helvety PDF - Mobile view',
        type: 'image',
      },
    ],
  },
  metadata: {
    targetAudience: ['professionals', 'students', 'privacy-conscious users'],
    platforms: ['web'],
    keywords: ['pdf', 'merge', 'split', 'privacy', 'browser'],
    featured: true,
    sortOrder: 1,
  },
}

/**
 * Helvety Explorer - SharePoint Online Extension
 */
export const helvetyExplorer: SoftwareProduct = {
  id: 'helvety-explorer',
  slug: 'helvety-explorer',
  name: 'Helvety Explorer',
  shortDescription:
    'A clean, modern, and fast SharePoint navigation extension. Easily browse all your SharePoint sites with customizable, searchable navigation.',
  description: `Helvety Explorer is a SharePoint Online Extension that transforms how you navigate your Microsoft 365 environment.

Install it once in your global app catalog and give all users instant access to a clean, modern, and lightning-fast navigation experience. Browse all SharePoint sites you have access to with a customizable, searchable interface that makes finding your content effortless.`,
  type: 'software',
  category: 'integrations',
  status: 'available',
  icon: 'LayoutGrid',
  features: [
    'Clean, modern navigation interface',
    'Lightning-fast site search',
    'Shows all accessible SharePoint sites',
    'Fully customizable appearance',
    'Easy global app catalog installation',
    'Works across your entire tenant',
    'Responsive design for all devices',
    'Regular updates and improvements',
  ],
  pricing: {
    hasFreeTier: false,
    hasYearlyPricing: false,
    tiers: [
      {
        id: 'helvety-explorer-standard',
        name: 'Standard',
        price: 9900,
        currency: 'CHF',
        interval: 'one-time',
        features: [
          'Full extension features',
          '1 year of updates',
          'Documentation',
          'Email support',
          'Single tenant license',
        ],
      },
      {
        id: 'helvety-explorer-enterprise',
        name: 'Enterprise',
        price: 29900,
        currency: 'CHF',
        interval: 'one-time',
        highlighted: true,
        features: [
          'Full extension features',
          'Lifetime updates',
          'Priority support',
          'Custom branding assistance',
          'Unlimited tenant license',
          'Deployment support',
        ],
      },
    ],
  },
  links: {
    github: 'https://github.com/AugiLabs/helvety-explorer',
  },
  software: {
    fileFormat: 'sppkg',
    requirements: [
      'SharePoint Online',
      'Microsoft 365 subscription',
      'Global app catalog access (for installation)',
    ],
    licenseType: 'perpetual',
  },
  metadata: {
    targetAudience: ['SharePoint administrators', 'IT departments', 'Microsoft 365 users'],
    platforms: ['SharePoint Online', 'Microsoft 365'],
    keywords: ['sharepoint', 'navigation', 'explorer', 'microsoft 365', 'sites'],
    featured: true,
    sortOrder: 2,
  },
}

// =============================================================================
// ALL PRODUCTS
// =============================================================================

/**
 * All available products
 */
export const products: Product[] = [helvetyPdf, helvetyExplorer]

// =============================================================================
// DATA ACCESS FUNCTIONS
// =============================================================================

/**
 * Get all products
 */
export function getAllProducts(): Product[] {
  return products
}

/**
 * Get a product by its slug
 */
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug)
}

/**
 * Get a product by its ID
 */
export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id)
}

/**
 * Get products filtered by criteria
 */
export function getFilteredProducts(filters: ProductFilters): Product[] {
  let filtered = [...products]

  // Filter by type
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter((product) => product.type === filters.type)
  }

  // Filter by category
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter((product) => product.category === filters.category)
  }

  // Filter by status
  if (filters.status) {
    filtered = filtered.filter((product) => product.status === filters.status)
  }

  // Filter by featured
  if (filters.featured) {
    filtered = filtered.filter((product) => product.metadata?.featured === true)
  }

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.shortDescription.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
    )
  }

  // Sort
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'price':
          const aPrice = a.pricing.tiers[0]?.price ?? 0
          const bPrice = b.pricing.tiers[0]?.price ?? 0
          comparison = aPrice - bPrice
          break
        case 'sortOrder':
          const aOrder = a.metadata?.sortOrder ?? 999
          const bOrder = b.metadata?.sortOrder ?? 999
          comparison = aOrder - bOrder
          break
        case 'createdAt':
          comparison = (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
          break
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })
  } else {
    // Default sort by sortOrder
    filtered.sort((a, b) => {
      const aOrder = a.metadata?.sortOrder ?? 999
      const bOrder = b.metadata?.sortOrder ?? 999
      return aOrder - bOrder
    })
  }

  return filtered
}

/**
 * Get all unique product types
 */
export function getProductTypes(): ProductType[] {
  const types = new Set(products.map((product) => product.type))
  return Array.from(types)
}

/**
 * Get featured products
 */
export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.metadata?.featured === true)
}

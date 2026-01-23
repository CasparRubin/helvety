# Helvety PDF

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

A privacy-focused, client-side PDF toolkit. Merge, reorder, rotate, and extract pages from PDF files and images without any server-side processing. All file processing happens entirely in your browser.

**App:** [pdf.helvety.com](https://pdf.helvety.com)

**Privacy First** - 100% Client-Side Processing. All file processing happens entirely in your browser. Your files never leave your device, and no data is collected or transmitted.

## Features

- **Client-side file processing** - All operations happen in your browser
- **PDF and image support** - Upload PDF files and images (PNG, JPEG, WebP, GIF, etc.)
- **Page thumbnails preview** - Visual preview of all pages before processing
- **Drag & drop reordering** - Easily rearrange pages by dragging thumbnails
- **Page rotation** - Rotate individual pages by 90° increments
- **Page deletion** - Remove unwanted pages from your documents
- **Page extraction** - Extract individual pages as separate PDF files
- **Multi-file merging** - Combine multiple PDF files and images into one PDF
- **Drag & drop upload** - Intuitive file upload interface
- **Customizable grid layout** - Adjust pages per row to accommodate different page sizes
- **Dark & Light mode support** - Comfortable viewing in any lighting condition

## How It Works

1. **Upload Files** - Drag and drop or click to browse and select multiple PDF files and/or images
2. **Preview & Manage** - See thumbnails of all pages, reorder by dragging, rotate, or delete pages as needed
3. **Download** - Your processed PDF downloads automatically with a timestamped filename

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.1.3](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.3](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[pdf-lib](https://pdf-lib.js.org/)** - PDF manipulation and creation
- **[pdfjs-dist](https://mozilla.github.io/pdf.js/)** - PDF rendering engine
- **[react-pdf](https://react-pdf.org/)** - PDF viewer component
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

## Project Structure

```
helvety-pdf/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── icon.svg           # App icon
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Main page component
│   ├── privacy/           # Privacy policy page
│   ├── terms/             # Terms of service page
│   ├── robots.ts          # Robots.txt configuration
│   └── sitemap.ts         # Sitemap configuration
├── components/            # React components
│   ├── ui/               # shadcn/ui component library
│   ├── error-boundary.tsx # Error boundary component
│   ├── navbar.tsx         # Navigation bar
│   ├── helvety-pdf.tsx    # Main PDF management component
│   ├── pdf-page-grid.tsx  # PDF page grid layout
│   ├── pdf-page-thumbnail.tsx  # Individual page thumbnail
│   ├── pdf-image-thumbnail.tsx # Image thumbnail component
│   ├── pdf-action-buttons.tsx   # Action buttons for PDF operations
│   ├── pdf-toolkit.tsx    # PDF toolkit utilities
│   ├── theme-provider.tsx # Theme context provider
│   └── theme-switcher.tsx # Dark/light mode switcher
├── hooks/                 # Custom React hooks
│   ├── use-columns.ts     # Column layout management hook
│   ├── use-drag-drop.ts   # Drag and drop functionality hook
│   ├── use-error-handler.ts # Error handling hook
│   ├── use-mobile.ts      # Mobile device detection hook
│   ├── use-page-drag-drop.ts # Page drag and drop functionality hook
│   ├── use-pdf-files.ts   # PDF file management hook
│   ├── use-pdf-page-state.ts # Page state management hook (deletions, rotations)
│   ├── use-pdf-processing.ts # PDF processing operations hook
│   ├── use-progressive-quality.ts # Progressive quality rendering hook
│   └── use-screen-size.ts # Screen size detection hook
├── lib/                   # Utility functions
│   ├── batch-processing.ts # Batch processing utilities
│   ├── blob-url-utils.ts  # Blob URL management utilities
│   ├── constants.ts       # Application constants
│   ├── error-formatting.ts # Error formatting utilities
│   ├── error-handler.ts   # Error handling utilities
│   ├── file-download.ts   # File download utilities
│   ├── file-processing.ts # File processing utilities
│   ├── file-validation.ts # File validation utilities
│   ├── logger.ts          # Logging utilities
│   ├── page-actions.tsx   # Page action components
│   ├── pdf-colors.ts      # PDF color utilities
│   ├── pdf-conversion.ts  # PDF conversion utilities
│   ├── pdf-errors.ts      # PDF error formatting
│   ├── pdf-extraction.ts  # PDF extraction utilities
│   ├── pdf-loading.ts     # PDF loading utilities
│   ├── pdf-lookup-utils.ts # PDF lookup utilities
│   ├── pdf-rotation.ts    # PDF page rotation utilities
│   ├── pdf-utils.ts       # PDF utility functions - main entry point and re-exports
│   ├── timeout-utils.ts  # Timeout utility functions
│   ├── types.ts           # TypeScript type definitions
│   ├── utils.ts           # General utility functions
│   └── validation-utils.ts # Validation utility functions
├── public/                # Static assets
│   ├── pdf.worker.min.mjs # PDF.js worker file (auto-synced via postinstall script)
│   └── *.svg              # Logo and branding assets
└── [config files]         # Configuration files (Next.js, TypeScript, etc.)
```

## Architecture & Performance

This application is built with performance and code quality in mind:

- **LRU Cache Strategy** - Uses Least Recently Used (LRU) cache eviction for optimal memory management
- **Batch Processing** - Processes PDF pages in adaptive batches (3-10 pages) to prevent UI blocking
- **Optimized Memoization** - Smart memoization with early short-circuiting for efficient re-renders
- **Type Safety** - Comprehensive TypeScript types with explicit return types throughout
- **Error Handling** - Centralized error handling with detailed context and recovery strategies
- **Code Organization** - Modular architecture with extracted utilities and reusable components

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company committed to transparency, strong security, and respect for user privacy and data protection.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

This repository is public for transparency purposes only—all code is open for inspection so users can verify its behavior.

**No license is granted; this is the default "All rights reserved" status.** You may view the code, but you cannot reuse, redistribute, or sell it without explicit permission. All rights are retained by the author.

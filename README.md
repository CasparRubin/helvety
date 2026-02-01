# Helvety PDF

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

## Demo

![Demo](./public/screencapture/demo.gif)

## Screenshots

<table>
  <tr>
    <td align="center"><strong>Dark Mode</strong></td>
    <td align="center"><strong>Light Mode</strong></td>
    <td align="center"><strong>Dark Mode - Editor</strong></td>
    <td align="center"><strong>Light Mode - Editor</strong></td>
    <td align="center"><strong>Mobile - Editor</strong></td>
  </tr>
  <tr>
    <td><img src="./public/screenshots/Dark%20mode.png" alt="Desktop upload interface in dark mode" width="200"/></td>
    <td><img src="./public/screenshots/Light%20mode.png" alt="Desktop upload interface in light mode" width="200"/></td>
    <td><img src="./public/screenshots/Dark%20mode%20Functionality.png" alt="Desktop PDF editor in dark mode" width="200"/></td>
    <td><img src="./public/screenshots/Light%20mode%20Functionality.png" alt="Desktop PDF editor in light mode" width="200"/></td>
    <td><img src="./public/screenshots/Dark%20mode%20Mobile%20Functionality.png" alt="Mobile PDF editor" width="100"/></td>
  </tr>
</table>

A privacy-focused, client-side PDF toolkit. Merge, reorder, rotate, and extract pages from PDF files and images with client-side processing (hosting provider may collect connection metadata). All file processing happens entirely in your browser.

**App:** [pdf.helvety.com](https://pdf.helvety.com) | **Subscribe:** [store.helvety.com](https://store.helvety.com/products/helvety-pdf)

**Privacy First** - 100% Client-Side Processing. All file processing happens entirely in your browser. The application does not collect or transmit your file data (hosting provider may collect connection metadata - see Privacy Policy).

Helvety PDF offers a free Basic tier with essential features, and a Pro subscription for unlimited usage and advanced features like page rotation.

## Features

- **Client-side file processing** - All operations happen in your browser
- **PDF and image support** - Upload PDF files and images (PNG, JPEG, WebP, GIF, etc.)
- **Page thumbnails preview** - Visual preview of all pages before processing
- **Drag & drop reordering** - Easily rearrange pages by dragging thumbnails
- **Page rotation** - Rotate individual pages by 90° increments _(Pro)_
- **Page deletion** - Remove unwanted pages from your documents
- **Page extraction** - Extract individual pages as separate PDF files
- **Multi-file merging** - Combine multiple PDF files and images into one PDF
- **Drag & drop upload** - Intuitive file upload interface
- **Customizable grid layout** - Adjust pages per row to accommodate different page sizes
- **Dark & Light mode support** - Comfortable viewing in any lighting condition

## Pricing

Helvety PDF offers a free Basic tier and a paid Pro subscription:

| Feature                | Basic (Free) | Pro (CHF 4.95/month) |
| ---------------------- | ------------ | -------------------- |
| Files                  | Max 2 files  | Unlimited            |
| Pages                  | Max 5 pages  | Unlimited            |
| Merge files            | Yes          | Yes                  |
| Split files            | Yes          | Yes                  |
| Reorder pages          | Yes          | Yes                  |
| Delete pages           | Yes          | Yes                  |
| Extract pages          | Yes          | Yes                  |
| Rotate pages           | -            | Yes                  |
| Client-side processing | Yes          | Yes                  |

Subscribe at [store.helvety.com](https://store.helvety.com/products/helvety-pdf)

## How It Works

1. **Upload Files** - Drag and drop or click to browse and select multiple PDF files and/or images
2. **Preview & Manage** - See thumbnails of all pages, reorder by dragging, rotate, or delete pages as needed
3. **Download** - Your processed PDF downloads automatically with a timestamped filename

## Security & Authentication

This application uses centralized authentication via [auth.helvety.com](https://auth.helvety.com) with end-to-end encryption:

### Authentication Flow

Authentication is handled by the centralized Helvety Auth service (`auth.helvety.com`) using **passkey-only authentication** — no email or password required:

**New Users:**

1. Redirected to auth.helvety.com → Click "Create Account"
2. Scan QR code with phone → Verify with biometrics (Face ID/fingerprint)
3. Account created → Session established → Redirected back to PDF app
4. Setup encryption passkey (for encrypting sensitive data)

**Returning Users:**

1. Redirected to auth.helvety.com → Click "Sign In"
2. Scan QR code → Verify with biometrics → Session created
3. Redirected back → Unlock encryption with passkey

Sessions are shared across all `*.helvety.com` subdomains via cookie-based SSO.

**Privacy Note:** Helvety accounts do not require an email address. When you make a purchase, your email and billing information is collected by Stripe, not stored by Helvety.

### End-to-End Encryption

User data is protected with client-side encryption using the WebAuthn PRF extension:

- **Passkey-derived keys** - Encryption keys are derived from your passkey using the PRF extension
- **Zero-knowledge** - The server never sees your encryption key; all encryption/decryption happens in the browser
- **Device-bound security** - Your passkey (stored on your phone) is the only way to decrypt your data
- **Cross-subdomain passkeys** - Encryption passkeys work across all Helvety apps (registered to `helvety.com` RP ID)

### Browser Requirements

Passkey encryption requires a modern browser with WebAuthn PRF support:

- Google Chrome 128+
- Microsoft Edge 128+
- Safari 18+

**Note:** Firefox is not currently supported for encryption passkeys due to limited PRF extension support.

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.1.6](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.4](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (Auth & Database)
- **[SimpleWebAuthn](https://simplewebauthn.dev/)** - WebAuthn/passkey authentication
- **[pdf-lib](https://pdf-lib.js.org/)** - PDF manipulation and creation
- **[pdfjs-dist](https://mozilla.github.io/pdf.js/)** - PDF rendering engine
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

## Project Structure

```
helvety-pdf/
├── app/                    # Next.js App Router
│   ├── actions/           # Server actions
│   │   ├── encryption-actions.ts # Encryption parameter management
│   │   ├── encryption-passkey-actions.ts # Passkey operations for encryption
│   │   └── subscription-actions.ts # Subscription status queries
│   ├── auth/callback/     # Session establishment callback
│   ├── globals.css        # Global styles
│   ├── icon.svg           # App icon
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Main page (redirects to auth if unauthenticated)
│   ├── page-client.tsx    # Client-side page component
│   ├── robots.ts          # Robots.txt configuration
│   └── sitemap.ts         # Sitemap configuration
├── components/            # React components
│   ├── ui/               # shadcn/ui component library
│   │   └── index.ts      # Barrel exports
│   ├── app-switcher.tsx   # Helvety ecosystem app switcher
│   ├── auth-provider.tsx  # Authentication context provider
│   ├── encryption-gate.tsx # Encryption setup/unlock gate
│   ├── encryption-setup.tsx # Encryption passkey setup
│   ├── encryption-stepper.tsx # Encryption flow progress indicator
│   ├── encryption-unlock.tsx # Encryption passkey unlock
│   ├── helvety-pdf.tsx    # Main PDF management component
│   ├── navbar.tsx         # Navigation bar
│   ├── pdf-action-buttons.tsx   # Action buttons for PDF operations
│   ├── pdf-image-thumbnail.tsx # Image thumbnail component
│   ├── pdf-imagebitmap-thumbnail.tsx # ImageBitmap-based thumbnail
│   ├── pdf-page-error-boundary.tsx # Page-level error boundary
│   ├── pdf-page-grid.tsx  # PDF page grid layout
│   ├── pdf-page-thumbnail.tsx  # Individual page thumbnail
│   ├── pdf-toolkit.tsx    # PDF toolkit utilities
│   ├── theme-provider.tsx # Theme context provider
│   ├── theme-switcher.tsx # Dark/light mode switcher
│   └── upgrade-prompt.tsx # Pro upgrade prompt dialog
├── hooks/                 # Custom React hooks
│   ├── index.ts           # Barrel exports
│   ├── use-columns.ts     # Column layout management
│   ├── use-drag-drop.ts   # Drag and drop functionality
│   ├── use-error-handler.ts # Error handling
│   ├── use-imagebitmap-memory.ts # ImageBitmap memory monitoring
│   ├── use-mobile.ts      # Mobile device detection
│   ├── use-page-drag-drop.ts # Page drag and drop functionality
│   ├── use-pdf-files.ts   # PDF file management with tier limits
│   ├── use-pdf-page-state.ts # Page state (deletions, rotations)
│   ├── use-pdf-processing.ts # PDF processing operations
│   ├── use-pdf-rendering.ts # PDF page rendering with caching
│   ├── use-pdf-worker.ts  # PDF worker management
│   ├── use-progressive-quality.ts # Progressive quality rendering
│   ├── use-screen-size.ts # Screen size detection
│   ├── use-subscription.ts # Subscription status hook
│   └── use-thumbnail-intersection.ts # Thumbnail intersection observer
├── lib/                   # Utility functions
│   ├── auth-redirect.ts   # Auth service redirect utilities
│   ├── config/            # Configuration
│   │   └── version.ts     # Build version info
│   ├── crypto/            # Encryption utilities
│   │   ├── encoding.ts    # Encoding helpers
│   │   ├── passkey.ts     # Passkey encryption
│   │   └── types.ts       # Crypto type definitions
│   ├── supabase/          # Supabase client utilities
│   │   ├── admin.ts       # Admin client
│   │   ├── client.ts      # Browser client
│   │   ├── client-factory.ts # Client factory
│   │   └── server.ts      # Server client
│   ├── types/             # Type definitions
│   │   ├── entities.ts    # Entity types
│   │   ├── index.ts       # Barrel exports
│   │   ├── pdf.ts         # PDF-specific types
│   │   └── subscription.ts # Subscription types and limits
│   ├── batch-processing.ts # Batch processing utilities
│   ├── blob-url-utils.ts  # Blob URL management
│   ├── constants.ts       # Application constants
│   ├── env-validation.ts  # Environment variable validation
│   ├── error-handler.ts   # Error handling utilities
│   ├── file-processing.ts # File processing utilities
│   ├── imagebitmap-cache.ts # ImageBitmap LRU cache
│   ├── logger.ts          # Logging utilities
│   ├── page-actions.tsx   # Page action components
│   ├── pdf-utils.ts       # PDF utilities (main entry point)
│   └── utils.ts           # General utilities
├── public/                # Static assets
│   ├── pdf.worker.min.mjs # PDF.js worker file
│   ├── pdf-rendering-worker.js # Custom rendering worker
│   └── *.svg              # Logo and branding assets
└── [config files]         # Configuration files
```

## Architecture & Performance

This application is built with performance and code quality in mind:

- **LRU Cache Strategy** - Uses Least Recently Used (LRU) cache eviction for optimal memory management
- **Batch Processing** - Processes PDF pages in adaptive batches (3-10 pages) to prevent UI blocking
- **Optimized Memoization** - Smart memoization with early short-circuiting for efficient re-renders
- **Strict TypeScript** - Comprehensive type safety with `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`, and other strict compiler options
- **Error Handling** - Centralized error handling with detailed context and recovery strategies
- **Code Organization** - Modular architecture with extracted utilities and reusable components

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company committed to transparency, strong security, and respect for user privacy and data protection.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

This repository is public for transparency purposes only. All code is open for inspection so users can verify its behavior.

**All Rights Reserved.** No license is granted. You may view the code, but you may not copy, reuse, redistribute, modify, or sell it without explicit written permission.

Purchasing a subscription grants access to use the hosted service only—subscriptions do not grant any rights to the source code.

See [LICENSE](./LICENSE) for full terms.

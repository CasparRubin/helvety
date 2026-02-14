# Helvety PDF

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
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

A privacy-focused, client-side PDF toolkit. Merge, reorder, rotate, and extract pages from PDF files and images with 100% client-side processing. All file processing happens entirely in your browser - your files are never uploaded to our servers.

**App:** [pdf.helvety.com](https://pdf.helvety.com)

**Privacy First** - 100% Client-Side Processing. All file processing happens entirely in your browser. Your file data is never uploaded to our servers. We use Vercel Analytics for anonymous page view statistics only (see [Privacy Policy](https://helvety.com/privacy)).

Helvety PDF is a 100% free tool with no limits and no login required. All features are available to everyone - unlimited files, unlimited pages.

## Service Availability

Helvety services are intended exclusively for customers located in Switzerland. **We are not able to serve customers in the EU/EEA.**

As a Swiss company, Helvety operates solely under the Swiss Federal Act on Data Protection (nDSG). Because we do not target or serve customers in the EU/EEA, the GDPR does not apply. For this reason, new users are asked to confirm during account creation on [auth.helvety.com](https://auth.helvety.com) that they are located in Switzerland before any personal data is stored. Note: Helvety PDF itself requires no login or account - this applies to other Helvety apps that require authentication.

## Features

- **Client-side file processing** - All operations happen in your browser
- **PDF and image support** - Upload PDF files and images (PNG, JPEG, WebP, GIF, etc.)
- **Page thumbnails preview** - Visual preview of all pages before processing
- **Drag & drop reordering** - Rearrange pages by dragging thumbnails
- **Page rotation** - Rotate individual pages by 90° increments
- **Page deletion** - Remove unwanted pages from your documents
- **Page extraction** - Extract individual pages as separate PDF files
- **Multi-file merging** - Combine multiple PDF files and images into one PDF
- **Drag & drop upload** - Simple file upload interface
- **Customizable grid layout** - Adjust pages per row to accommodate different page sizes
- **Dark & Light mode support** - Switch between dark and light themes
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts)
- **Unlimited files and pages** - No restrictions, completely free
- **No login required** - Use the tool instantly, no account needed

## How It Works

1. **Upload Files** - Drag and drop or click to browse and select multiple PDF files and/or images
2. **Preview & Manage** - See thumbnails of all pages, reorder by dragging, rotate, or delete pages as needed
3. **Download** - Your processed PDF downloads automatically with a timestamped filename

## Security

**Note:** End-to-end encryption is not used in this app. E2EE is used by [Helvety Tasks](https://tasks.helvety.com) and [Helvety Contacts](https://contacts.helvety.com).

### Security Hardening

This application includes the following security hardening:

- **Security Headers** - CSP, HSTS, and other security headers

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are exclusively available to customers in Switzerland and are not offered to EU/EEA residents; new users must confirm they are located in Switzerland during account creation on [auth.helvety.com](https://auth.helvety.com) (before any personal data is stored). Only the Swiss Federal Act on Data Protection (nDSG) applies; the GDPR does not apply. An informational cookie notice informs visitors that only essential cookies are used.

**Abuse Reporting:** Abuse reports can be submitted to [contact@helvety.com](mailto:contact@helvety.com). The Impressum on [helvety.com/impressum](https://helvety.com/impressum#abuse) includes an abuse reporting section with guidance for both users and law enforcement.

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.1.6](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.4](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[pdf-lib](https://pdf-lib.js.org/)** - PDF manipulation and creation
- **[react-pdf](https://www.npmjs.com/package/react-pdf)** - React components for PDF display
- **[pdfjs-dist](https://mozilla.github.io/pdf.js/)** - PDF rendering engine (used by react-pdf)
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

## Architecture & Performance

This application is built with performance and code quality in mind:

- **LRU Cache Strategy** - Uses Least Recently Used (LRU) cache eviction for optimal memory management
- **Batch Processing** - Processes PDF pages in adaptive batches (3-10 pages) to prevent UI blocking
- **Optimized Memoization** - Memoization with early short-circuiting to reduce re-renders
- **Strict TypeScript** - Strict type safety with `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`, and other strict compiler options
- **Error Handling** - Centralized error handling with detailed context and recovery strategies
- **Code Organization** - Modular architecture with extracted utilities and reusable components

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company focused on security and user privacy.

Vercel Analytics is used across all Helvety apps for privacy-focused, anonymous page view statistics. Vercel Speed Insights is enabled only on [helvety.com](https://helvety.com). See our [Privacy Policy](https://helvety.com/privacy) for details.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com). To report abuse, contact [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

> **This is NOT open source software.**

This repository is public so users can inspect and verify the application's behavior and security.

**All Rights Reserved.** No license is granted for any use of this code. You may:

- View and inspect the code

You may NOT:

- Copy, use, or reuse the code in any form
- Redistribute, publish, or share the code
- Modify, adapt, or create derivative works
- Sell, sublicense, or commercially exploit the code
- Reverse engineer or decompile the code

See [LICENSE](./LICENSE) for full legal terms.

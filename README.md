# Helvety.com

![Next.js](https://img.shields.io/badge/Next.js-16.0.8-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

The main Helvety website. Software and apparel designed and developed in Switzerland.

**Website:** [helvety.com](https://helvety.com)

## Features

- **App Switcher** - Navigate between Helvety ecosystem apps (PDF, Store, and more)
- **Dark & Light mode** - Comfortable viewing in any lighting condition
- **Legal pages** - Impressum, Privacy Policy, and Terms of Service
- **SEO optimized** - Sitemap and robots.txt for search engine visibility
- **Animated logo** - Subtle glow effect on the main logo

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.0.8](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.1](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

## Project Structure

```
helvety.com/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css         # Global styles
│   │   ├── icon.svg            # App icon
│   │   ├── layout.tsx          # Root layout component
│   │   ├── page.tsx            # Main page component
│   │   ├── impressum/          # Impressum page
│   │   ├── privacy/            # Privacy policy page
│   │   ├── terms/              # Terms of service page
│   │   ├── robots.ts           # Robots.txt configuration
│   │   └── sitemap.ts          # Sitemap configuration
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui component library
│   │   ├── app-switcher.tsx    # Helvety ecosystem app switcher
│   │   ├── navbar.tsx          # Navigation bar
│   │   ├── theme-provider.tsx  # Theme context provider
│   │   └── theme-switcher.tsx  # Dark/light mode switcher
│   └── lib/                    # Utility functions
│       ├── config/             # Configuration files
│       │   └── version.ts      # Build version
│       └── utils.ts            # General utility functions
├── public/                     # Static assets
│   └── *.svg                   # Logo and branding assets
├── scripts/                    # Build scripts
│   └── generate-version.js    # Version generation script
└── [config files]              # Configuration files (Next.js, TypeScript, etc.)
```

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company committed to transparency, strong security, and respect for user privacy and data protection.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

This repository is public for transparency purposes only—all code is open for inspection so users can verify its behavior.

**No license is granted; this is the default "All rights reserved" status.** You may view the code, but you cannot reuse, redistribute, or sell it without explicit permission. All rights are retained by the author.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-XX

### Added

- Client-side PDF processing with 100% browser-based operations
- PDF page thumbnails preview for visual page management
- Drag & drop reordering of PDF pages
- Page rotation functionality (90° increments)
- Page deletion capability
- Page extraction as separate PDF files
- Multi-file PDF merging
- Drag & drop file upload interface
- Customizable grid layout with adjustable pages per row (2-10 columns)
- Grid column preference persistence in localStorage
- Dark mode support with theme switching
- Privacy-first architecture with no server-side processing
- No data collection or tracking

### Fixed

- Fixed race condition where thumbnails for subsequent pages of the first uploaded file would show loading indicators indefinitely. Replaced module-level flags with Promise-based worker initialization to ensure all components are properly notified when the PDF.js worker is ready.

### Technical

- Built with Next.js 16.1.0 and React 19.2.3
- TypeScript for type safety
- pdf-lib for PDF manipulation
- pdfjs-dist for PDF rendering
- shadcn/ui component library
- Tailwind CSS for styling

[0.1.0]: https://github.com/helvety/helvety-pdf/releases/tag/v0.1.0


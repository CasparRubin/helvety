import localFont from "next/font/local";

/**
 * Self-hosted Material Symbols for the Eigenpal docx editor toolbar.
 * Replaces the Google Fonts CDN `@import` in `app/globals.css`.
 */
export const materialSymbols = localFont({
  src: "../app/fonts/material-symbols-outlined.woff2",
  variable: "--font-material-symbols",
  display: "swap",
  weight: "100 700",
});

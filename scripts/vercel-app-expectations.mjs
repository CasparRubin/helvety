/**
 * Canonical Vercel project ↔ monorepo app mapping for Helvety zones.
 * Used by check-vercel-app-config-consistency.mjs and env.template guardrails.
 *
 * @type {Record<string, { vercelProject: string; rootDirectory: string; displayName: string; forbiddenRootDirectories?: string[] }>}
 */
export const VERCEL_APP_EXPECTATIONS = {
  web: {
    vercelProject: "helvety-com",
    rootDirectory: "apps/web",
    displayName: "Web (Gateway)",
  },
  store: {
    vercelProject: "helvety-store",
    rootDirectory: "apps/store",
    displayName: "Store",
  },
  pdf: {
    vercelProject: "helvety-pdf",
    rootDirectory: "apps/pdf",
    displayName: "PDF",
  },
  "image-editor": {
    vercelProject: "helvety-image-editor",
    rootDirectory: "apps/image-editor",
    displayName: "Image Editor",
  },
  ocr: {
    vercelProject: "helvety-ocr",
    rootDirectory: "apps/ocr",
    displayName: "OCR",
  },
};

/** Minimal vercel.json shared by every zone app. */
export const CANONICAL_VERCEL_JSON = {
  $schema: "https://openapi.vercel.sh/vercel.json",
  framework: "nextjs",
};

/**
 * Canonical Vercel project ↔ monorepo app mapping for Helvety zones.
 * Used by check-vercel-app-config-consistency.mjs and env.template guardrails.
 *
 * @type {Record<string, { vercelProject: string; rootDirectory: string; displayName: string; forbiddenRootDirectories?: string[] }>}
 */
export const VERCEL_APP_EXPECTATIONS = {
  auth: {
    vercelProject: "helvety-auth",
    rootDirectory: "apps/auth",
    displayName: "Auth",
  },
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
  docs: {
    vercelProject: "helvety-docs",
    rootDirectory: "apps/docs",
    displayName: "Docs",
    forbiddenRootDirectories: ["docs"],
  },
  "image-upscaler": {
    vercelProject: "helvety-image-upscaler",
    rootDirectory: "apps/image-upscaler",
    displayName: "Image Upscaler",
  },
  tasks: {
    vercelProject: "helvety-tasks",
    rootDirectory: "apps/tasks",
    displayName: "Tasks",
  },
  contacts: {
    vercelProject: "helvety-contacts",
    rootDirectory: "apps/contacts",
    displayName: "Contacts",
  },
  notes: {
    vercelProject: "helvety-notes",
    rootDirectory: "apps/notes",
    displayName: "Notes",
  },
  links: {
    vercelProject: "helvety-links",
    rootDirectory: "apps/links",
    displayName: "Links",
  },
};

/** Minimal vercel.json shared by every zone app. */
export const CANONICAL_VERCEL_JSON = {
  $schema: "https://openapi.vercel.sh/vercel.json",
  framework: "nextjs",
};

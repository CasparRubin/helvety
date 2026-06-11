import { createPublicToolNextConfig } from "@helvety/config/next";

export default createPublicToolNextConfig({
  appName: "docs",
  optimizePackageImports: ["lucide-react", "@eigenpal/docx-editor-react"],
  overrides: {
    experimental: {
      serverActions: {
        // Vault saves send doubly base64-encoded docx ciphertext (~1.78x the
        // 20MB MAX_DOCX_BYTES), far above the 1MB Next.js default.
        bodySizeLimit: "40mb",
      },
    },
  },
});

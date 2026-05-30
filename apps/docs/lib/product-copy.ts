import { DOCS_APP_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { HELVETY_SWISS_ORIGIN_SEO } from "@helvety/shared/licensing";
import { DOCS_FILE_SIZE_LIMIT_COPY } from "@helvety/shared/product-file-limit-copy";

export { DOCS_APP_DESCRIPTION };

/**
 * PWA `public/manifest.json` summary; keep aligned with `ci:check` (`consistency:install-manifest-metadata`).
 * Theme/light-dark is UX only; do not add to SEO descriptions here or in `DOCS_APP_DESCRIPTION`.
 */
export const DOCS_PWA_MANIFEST_DESCRIPTION = `Edit Word documents in your browser. Local editing needs no account; optional vault save encrypts titles and .docx files on your device (${DOCS_FILE_SIZE_LIMIT_COPY}). ${HELVETY_SWISS_ORIGIN_SEO}`;

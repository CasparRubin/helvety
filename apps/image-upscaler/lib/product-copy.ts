import { HELVETY_SOURCE_LICENSE_MARKETING } from "@helvety/shared/licensing";
import { IMAGE_FILE_SIZE_LIMIT_COPY } from "@helvety/shared/product-file-limit-copy";

export { IMAGE_FILE_SIZE_LIMIT_COPY };

export const IMAGE_UPSCALER_APP_DESCRIPTION = `Upscale PNG, JPEG, and WebP in your browser with on-device AI when supported, plus an automatic high-quality resize fallback (${IMAGE_FILE_SIZE_LIMIT_COPY}). Batches up to five files, no server-side image processing and no sign-in. Switzerland-first service posture (not actively targeted to EU/EEA markets). ${HELVETY_SOURCE_LICENSE_MARKETING}, Swiss-built.`;

/** PWA `public/manifest.json` summary; keep aligned with CI (`consistency:install-manifest-metadata`). */
export const IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION = `Upscale images in your browser with AI when supported. No account required. ${HELVETY_SOURCE_LICENSE_MARKETING}, Swiss-built.`;

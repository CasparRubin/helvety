export const IMAGE_FILE_SIZE_LIMIT_COPY = "up to 25MB per image";

export const IMAGE_UPSCALER_APP_DESCRIPTION = `Upscale images in your browser with on-device AI (Real-ESRGAN via onnxruntime-web, WebGPU with WASM fallback) and an automatic high-quality canvas fallback when WebAssembly is unavailable: 2×/4× or target width/height for PNG, JPEG, and WebP (${IMAGE_FILE_SIZE_LIMIT_COPY}), batches up to five files, no server-side image processing and no sign-in. The AI model downloads lazily on first use and caches locally. Very large outputs may be reduced on some browsers to fit canvas limits. Switzerland-first service posture (not actively targeted to EU/EEA markets). MIT-licensed work from Switzerland.`;

/** PWA `public/manifest.json` summary; keep aligned with CI (`consistency:install-manifest-metadata`). */
export const IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION =
  "2×/4× or target-size image upscaler in your browser (Real-ESRGAN AI with canvas fallback). No account required. MIT-licensed, Swiss roots.";

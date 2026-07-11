import {
  createAppProxy,
  createProfiledSecurityProxy,
} from "@helvety/shared/proxy";

export const proxy = createAppProxy({
  securityProxy: createProfiledSecurityProxy("public-tool", {
    // tesseract.js compiles WebAssembly modules for the OCR engine; required
    // the same way image-upscaler enables it for onnxruntime-web.
    buildCspOptions: { wasmUnsafeEval: true },
  }),
  defaultBasePath: "/ocr",
  failClosedOnAuthRefresh: true,
});

/** Must stay identical to `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires a static literal). */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|json|map|woff2?|mjs|wasm)$).*)",
  ],
};

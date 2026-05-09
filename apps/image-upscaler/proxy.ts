import {
  createAppProxy,
  createProfiledSecurityProxy,
} from "@helvety/shared/proxy";

export const proxy = createAppProxy({
  securityProxy: createProfiledSecurityProxy("public-tool", {
    // onnxruntime-web compiles WebAssembly modules at startup; required for
    // the ONNX-backed AI upscale engine.
    buildCspOptions: { wasmUnsafeEval: true },
  }),
  defaultBasePath: "/image-upscaler",
});

/** Must stay identical to `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires a static literal). */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|json|map|woff2?|mjs|wasm)$).*)",
  ],
};

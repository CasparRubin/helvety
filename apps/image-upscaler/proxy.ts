import {
  createAppProxy,
  createProfiledSecurityProxy,
} from "@helvety/shared/proxy";

export const proxy = createAppProxy({
  securityProxy: createProfiledSecurityProxy("public-tool", {
    // onnxruntime-web compiles WebAssembly modules at startup; required for
    // the ONNX-backed AI upscale engines.
    buildCspOptions: { wasmUnsafeEval: true },
  }),
  defaultBasePath: "/image-upscaler",
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
  ],
};

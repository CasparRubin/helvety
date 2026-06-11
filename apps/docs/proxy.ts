import {
  createAppProxy,
  createProfiledSecurityProxy,
} from "@helvety/shared/proxy";

export const proxy = createAppProxy({
  securityProxy: createProfiledSecurityProxy("public-tool", {
    buildCspOptions: {
      imgBlob: true,
      scriptUnsafeEval: "dev-only",
      workerBlob: true,
    },
  }),
  defaultBasePath: "/docs",
  failClosedOnAuthRefresh: true,
});

/** Must stay identical to `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires a static literal). */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|json|map|woff2?|mjs|wasm)$).*)",
  ],
};

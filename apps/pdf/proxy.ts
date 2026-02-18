import { createSessionRefreshProxy } from "@helvety/shared/proxy";

const proxy = createSessionRefreshProxy({
  buildCspOptions: {
    imgBlob: true,
    scriptUnsafeEval: "always",
    workerBlob: true,
  },
});
export { proxy };
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

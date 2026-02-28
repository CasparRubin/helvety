import { createSecurityProxy } from "@helvety/shared/proxy";

const proxy = createSecurityProxy({
  buildCspOptions: { imgBlob: true },
});
export { proxy };
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
  ],
};

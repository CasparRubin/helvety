import { createProfiledSecurityProxy } from "@helvety/shared/proxy";

const proxy = createProfiledSecurityProxy("public-marketing");
export { proxy };
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth|store|pdf|image-upscaler|image-editor|tasks|contacts|notes|links|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|json|map|woff2?|mjs|wasm)$).*)",
  ],
};

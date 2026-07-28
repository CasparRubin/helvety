import { createProfiledSecurityProxy } from "@helvety/shared/proxy";

const proxy = createProfiledSecurityProxy("public-marketing");
export { proxy };
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|store|pdf|image-editor|ocr|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|json|map|woff2?|mjs|wasm)$).*)",
  ],
};

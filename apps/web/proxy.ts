import { createProfiledSecurityProxy } from "@helvety/shared/proxy";

const proxy = createProfiledSecurityProxy("public-marketing");
export { proxy };
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth|store|pdf|image-upscaler|tasks|contacts|notes|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
  ],
};

import {
  createAppProxy,
  createProfiledSecurityProxy,
} from "@helvety/shared/proxy";

export const proxy = createAppProxy({
  securityProxy: createProfiledSecurityProxy("store-gateway"),
  defaultBasePath: "/store",
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
  ],
};

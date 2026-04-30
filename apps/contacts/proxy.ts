import {
  createAppProxy,
  createProfiledSecurityProxy,
} from "@helvety/shared/proxy";

const LEGACY_CONTACT_DETAIL_REGEX =
  /^\/(?:contacts\/)?(?:contacts\/)?[0-9a-fA-F-]{8,}(?:\/.*)?$/;

/** Redirect legacy detail routes, then apply shared security proxy. */
export const proxy = createAppProxy({
  securityProxy: createProfiledSecurityProxy("e2ee-app"),
  defaultBasePath: "/contacts",
  legacyPathRegexes: [LEGACY_CONTACT_DETAIL_REGEX],
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
  ],
};

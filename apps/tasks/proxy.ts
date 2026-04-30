import {
  createAppProxy,
  createProfiledSecurityProxy,
} from "@helvety/shared/proxy";

const LEGACY_TASKS_PATH_REGEX =
  /^\/(?:tasks\/)?(?:units|spaces|items)(?:\/.*)?$/;

/** Redirect deprecated legacy task paths, then apply shared security proxy. */
export const proxy = createAppProxy({
  securityProxy: createProfiledSecurityProxy("e2ee-app"),
  defaultBasePath: "/tasks",
  legacyPathRegexes: [LEGACY_TASKS_PATH_REGEX],
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
  ],
};

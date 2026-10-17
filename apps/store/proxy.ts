import {
  createAppProxy,
  createProfiledSecurityProxy,
} from "@helvety/shared/proxy";
import { findStoreProductCardBySlug } from "@helvety/shared/store-catalog";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

const appProxy = createAppProxy({
  securityProxy: createProfiledSecurityProxy("store-gateway"),
  defaultBasePath: "/store",
});

/** Matches `/products/<slug>` with or without the zone base path. */
const PRODUCT_PATH_PATTERN = /^\/(?:store\/)?products\/([^/]+)\/?$/;

/**
 * Proxy: keep the security/redirect contract, and reject unknown product
 * slugs before the page streams so they return a real 404 status.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const response = await appProxy(request);
  const match = PRODUCT_PATH_PATTERN.exec(request.nextUrl.pathname);
  if (!match?.[1]) {
    return response;
  }

  let slug: string;
  try {
    slug = decodeURIComponent(match[1]);
  } catch {
    slug = match[1];
  }

  if (findStoreProductCardBySlug(slug)) {
    return response;
  }

  const notFoundResponse = NextResponse.rewrite(
    new URL("/store/products/not-found", request.url),
    { status: 404 }
  );
  const csp = response.headers.get("content-security-policy");
  if (csp) {
    notFoundResponse.headers.set("content-security-policy", csp);
  }
  return notFoundResponse;
}

/** Must stay identical to `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires a static literal). */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|json|map|woff2?|mjs|wasm|traineddata)$).*)",
  ],
};

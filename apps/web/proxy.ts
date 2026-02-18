import { createSessionRefreshProxy } from "@helvety/shared/proxy";

const proxy = createSessionRefreshProxy({
  includeHelvetyUrl: false,
  includeCsrf: false,
});
export { proxy };
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth|store|pdf|tasks|contacts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

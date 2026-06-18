import "server-only";

import { HELVETY_PATHNAME_HEADER_NAME } from "@helvety/shared/proxy";
import { headers } from "next/headers";

const HERO_OVERFLOW_PROPS = {
  shellColumnClassName: "!overflow-visible",
  scrollAreaRootClassName: "!overflow-visible",
  scrollAreaViewportClassName: "!overflow-visible bg-background",
  bodyClassName: "overflow-x-clip",
} as const;

const DEFAULT_SHELL_PROPS = {
  bodyClassName: "overflow-x-clip",
} as const;

/** Shell overflow props for the web gateway: Hyperspeed bleed on `/` only. */
export async function getGatewayShellLayoutProps(): Promise<
  typeof HERO_OVERFLOW_PROPS | typeof DEFAULT_SHELL_PROPS
> {
  const pathname = (await headers()).get(HELVETY_PATHNAME_HEADER_NAME) ?? "";
  return pathname === "/" ? HERO_OVERFLOW_PROPS : DEFAULT_SHELL_PROPS;
}

import { HELVETY_PATHNAME_HEADER_NAME } from "@helvety/shared/proxy";
import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

import { getGatewayShellLayoutProps } from "./gateway-shell-props";

describe("getGatewayShellLayoutProps", () => {
  beforeEach(() => {
    headersMock.mockReset();
  });

  it("enables SideRays bleed shell props on the home route", async () => {
    headersMock.mockResolvedValue(
      new Headers([[HELVETY_PATHNAME_HEADER_NAME, "/"]])
    );

    await expect(getGatewayShellLayoutProps()).resolves.toEqual({
      shellColumnClassName: "!overflow-visible",
      scrollAreaRootClassName: "!overflow-visible",
      scrollAreaViewportClassName: "!overflow-visible bg-background",
      bodyClassName: "overflow-x-clip",
    });
  });

  it("uses default scroll clipping on legal routes", async () => {
    for (const pathname of ["/privacy", "/terms", "/impressum"]) {
      headersMock.mockResolvedValue(
        new Headers([[HELVETY_PATHNAME_HEADER_NAME, pathname]])
      );

      await expect(getGatewayShellLayoutProps()).resolves.toEqual({
        bodyClassName: "overflow-x-clip",
      });
    }
  });

  it("defaults to scroll clipping when pathname header is missing", async () => {
    headersMock.mockResolvedValue(new Headers());

    await expect(getGatewayShellLayoutProps()).resolves.toEqual({
      bodyClassName: "overflow-x-clip",
    });
  });
});

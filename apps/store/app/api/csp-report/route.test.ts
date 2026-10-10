import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCspReportHandler: vi.fn(),
  handler: vi.fn(),
}));

vi.mock("@helvety/shared/csp-report", () => ({
  createCspReportHandler: mocks.createCspReportHandler,
}));

mocks.createCspReportHandler.mockReturnValue(mocks.handler);

describe("store CSP route", () => {
  it("exports a scoped CSP POST handler", async () => {
    const routeModule = await import("./route");
    expect(mocks.createCspReportHandler).toHaveBeenCalledWith("store");
    expect(routeModule.POST).toBe(mocks.handler);
  });
});

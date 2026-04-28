import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCspReportHandler: vi.fn(),
  handler: vi.fn(),
}));

vi.mock("@helvety/shared/csp-report", () => ({
  createCspReportHandler: mocks.createCspReportHandler,
}));

mocks.createCspReportHandler.mockReturnValue(mocks.handler);

describe("web CSP route", () => {
  it("exports node runtime and domain-scoped CSP POST handler", async () => {
    const routeModule = await import("./route");
    expect(routeModule.runtime).toBe("nodejs");
    expect(mocks.createCspReportHandler).toHaveBeenCalledWith("helvety.com");
    expect(routeModule.POST).toBe(mocks.handler);
  });
});

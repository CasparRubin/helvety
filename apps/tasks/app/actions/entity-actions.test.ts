import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  logUnexpectedError: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: mocks.logUnexpectedError,
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next/server", () => ({
  after: (callback: () => void) => callback(),
}));

import { getAllTaskDataForExport } from "./entity-actions";

describe("tasks entity-actions getAllTaskDataForExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses EXPORT readRateLimitConfig for getAllTaskDataForExport", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "rate limited" },
    });

    await getAllTaskDataForExport();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        rateLimitPrefix: "export",
        readRateLimitConfig: { maxRequests: 5, windowMs: 60_000 },
      })
    );
  });
});

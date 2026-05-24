import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCachedCSRFTokenMock, getCachedUserMock } = vi.hoisted(() => ({
  getCachedCSRFTokenMock: vi.fn(),
  getCachedUserMock: vi.fn(),
}));

vi.mock("./cached-server", () => ({
  getCachedCSRFToken: getCachedCSRFTokenMock,
  getCachedUser: getCachedUserMock,
}));

import {
  bootstrapAuthLayoutSession,
  bootstrapE2eeLayoutSession,
  bootstrapPublicLayoutUser,
} from "./layout-session-bootstrap";
import { logger } from "./logger";

describe("bootstrapPublicLayoutUser", () => {
  beforeEach(() => {
    getCachedUserMock.mockReset();
    vi.spyOn(logger, "logUnexpectedError").mockImplementation(() => {});
  });

  it("returns the cached user", async () => {
    getCachedUserMock.mockResolvedValue({ id: "user-1" });

    await expect(bootstrapPublicLayoutUser()).resolves.toEqual({
      id: "user-1",
    });
  });

  it("logs and returns null when getCachedUser throws", async () => {
    const error = new Error("auth lookup failed");
    getCachedUserMock.mockRejectedValue(error);

    await expect(bootstrapPublicLayoutUser()).resolves.toBeNull();
    expect(logger.logUnexpectedError).toHaveBeenCalledWith(
      "Layout initialization failed",
      error
    );
  });
});

describe("bootstrapAuthLayoutSession", () => {
  beforeEach(() => {
    getCachedCSRFTokenMock.mockReset();
    getCachedUserMock.mockReset();
    vi.spyOn(logger, "logUnexpectedError").mockImplementation(() => {});
  });

  it("returns the same CSRF + user contract as bootstrapE2eeLayoutSession", async () => {
    getCachedCSRFTokenMock.mockResolvedValue("csrf-token");
    getCachedUserMock.mockResolvedValue({ id: "user-1" });

    await expect(bootstrapAuthLayoutSession()).resolves.toEqual({
      csrfToken: "csrf-token",
      initialUser: { id: "user-1" },
    });
  });
});

describe("bootstrapE2eeLayoutSession", () => {
  beforeEach(() => {
    getCachedCSRFTokenMock.mockReset();
    getCachedUserMock.mockReset();
    vi.spyOn(logger, "logUnexpectedError").mockImplementation(() => {});
  });

  it("returns CSRF token and user in parallel", async () => {
    getCachedCSRFTokenMock.mockResolvedValue("csrf-token");
    getCachedUserMock.mockResolvedValue({ id: "user-1" });

    await expect(bootstrapE2eeLayoutSession()).resolves.toEqual({
      csrfToken: "csrf-token",
      initialUser: { id: "user-1" },
    });
  });

  it("coerces a null CSRF token to an empty string", async () => {
    getCachedCSRFTokenMock.mockResolvedValue(null);
    getCachedUserMock.mockResolvedValue(null);

    await expect(bootstrapE2eeLayoutSession()).resolves.toEqual({
      csrfToken: "",
      initialUser: null,
    });
  });

  it("logs and returns empty session state when bootstrap throws", async () => {
    const error = new Error("layout bootstrap failed");
    getCachedCSRFTokenMock.mockRejectedValue(error);

    await expect(bootstrapE2eeLayoutSession()).resolves.toEqual({
      csrfToken: "",
      initialUser: null,
    });
    expect(logger.logUnexpectedError).toHaveBeenCalledWith(
      "Layout initialization failed",
      error
    );
  });
});

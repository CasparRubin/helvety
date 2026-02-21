/* eslint-disable no-console -- Test file: console spying is required to verify logger output */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("logger", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("emits structured JSON for error in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("./logger");

    logger.error("Something failed", { userId: "abc" });

    expect(console.error).toHaveBeenCalledOnce();
    const output = (console.error as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("Something failed");
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.metadata).toEqual({ userId: "abc" });
  });

  it("emits structured JSON for warn in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("./logger");

    logger.warn("Watch out");

    expect(console.warn).toHaveBeenCalledOnce();
    const output = (console.warn as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe("warn");
    expect(parsed.message).toBe("Watch out");
  });

  it("emits structured JSON for info in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("./logger");

    logger.info("Audit event", { action: "login" });

    expect(console.log).toHaveBeenCalledOnce();
    const output = (console.log as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe("info");
    expect(parsed.metadata).toEqual({ action: "login" });
  });

  it("suppresses debug in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("./logger");

    logger.debug("Hidden");

    expect(console.debug).not.toHaveBeenCalled();
  });

  it("redacts sensitive keys from structured output", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("./logger");

    logger.error("Auth failed", {
      password: "secret123",
      userId: "user-1",
    });

    const output = (console.error as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.metadata).not.toHaveProperty("password");
    expect(parsed.metadata.userId).toBe("user-1");
  });
});

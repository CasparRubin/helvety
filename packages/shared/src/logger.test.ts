/* eslint-disable no-console -- Test file: console spying is required to verify logger output */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getStructuredLogOutput = (spy: {
  mock: { calls: unknown[][] };
}): string => {
  const firstCall = spy.mock.calls[0];
  if (!firstCall) {
    throw new Error("Expected logger call to exist");
  }

  const firstArg = firstCall[0];
  if (typeof firstArg !== "string") {
    throw new Error("Expected logger payload to be a string");
  }

  return firstArg;
};

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
    const output = getStructuredLogOutput(
      console.error as unknown as { mock: { calls: unknown[][] } }
    );
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("Something failed");
    expect(parsed.timestamp).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(parsed.timestamp))).toBe(false);
    expect(parsed.metadata).toEqual({ userId: "abc" });
  });

  it("emits structured JSON for warn in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("./logger");

    logger.warn("Watch out");

    expect(console.warn).toHaveBeenCalledOnce();
    const output = getStructuredLogOutput(
      console.warn as unknown as { mock: { calls: unknown[][] } }
    );
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe("warn");
    expect(parsed.message).toBe("Watch out");
  });

  it("emits structured JSON for info in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("./logger");

    logger.info("Audit event", { action: "login" });

    expect(console.log).toHaveBeenCalledOnce();
    const output = getStructuredLogOutput(
      console.log as unknown as { mock: { calls: unknown[][] } }
    );
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

    const output = getStructuredLogOutput(
      console.error as unknown as { mock: { calls: unknown[][] } }
    );
    const parsed = JSON.parse(output);
    expect(parsed.metadata).not.toHaveProperty("password");
    expect(parsed.metadata.userId).toBe("user-1");
  });

  it("redacts PII keys (email, phone, address) from structured output", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("./logger");

    logger.error("User data leak attempt", {
      email: "user@example.com",
      phone: "+41791234567",
      address: "Bahnhofstrasse 1",
      action: "export",
    });

    const output = getStructuredLogOutput(
      console.error as unknown as { mock: { calls: unknown[][] } }
    );
    const parsed = JSON.parse(output);
    expect(parsed.metadata).not.toHaveProperty("email");
    expect(parsed.metadata).not.toHaveProperty("phone");
    expect(parsed.metadata).not.toHaveProperty("address");
    expect(parsed.metadata.action).toBe("export");
  });

  it("logUnexpectedError emits Error message and scope in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("./logger");

    logger.logUnexpectedError("createItem", new Error("boom"));

    expect(console.error).toHaveBeenCalledOnce();
    const output = getStructuredLogOutput(
      console.error as unknown as { mock: { calls: unknown[][] } }
    );
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("boom");
    expect(parsed.metadata?.scope).toBe("createItem");
  });

  it("logUnexpectedError wraps non-Error values with scope as message", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("./logger");

    logger.logUnexpectedError("rpc", "failure");

    const output = getStructuredLogOutput(
      console.error as unknown as { mock: { calls: unknown[][] } }
    );
    const parsed = JSON.parse(output);
    expect(parsed.message).toBe("rpc");
    expect(parsed.metadata?.scope).toBe("rpc");
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/* eslint-disable no-console */
// We need to test logger with different NODE_ENV values
describe("logger", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    (process.env as { NODE_ENV: string }).NODE_ENV = originalNodeEnv;
    vi.restoreAllMocks();
  });

  describe("in development mode", () => {
    beforeEach(async () => {
      (process.env as { NODE_ENV: string }).NODE_ENV = "development";
      vi.resetModules();
    });

    it("should log messages in development", async () => {
      const { logger } = await import("@/lib/logger");
      logger.log("test message");
      expect(console.log).toHaveBeenCalledWith("test message");
    });

    it("should log errors in development", async () => {
      const { logger } = await import("@/lib/logger");
      logger.error("error message");
      expect(console.error).toHaveBeenCalledWith("error message");
    });

    it("should log warnings in development", async () => {
      const { logger } = await import("@/lib/logger");
      logger.warn("warn message");
      expect(console.warn).toHaveBeenCalledWith("warn message");
    });

    it("should log info in development", async () => {
      const { logger } = await import("@/lib/logger");
      logger.info("info message");
      expect(console.info).toHaveBeenCalledWith("info message");
    });

    it("should log debug in development", async () => {
      const { logger } = await import("@/lib/logger");
      logger.debug("debug message");
      expect(console.debug).toHaveBeenCalledWith("debug message");
    });
  });

  describe("in production mode", () => {
    beforeEach(async () => {
      (process.env as { NODE_ENV: string }).NODE_ENV = "production";
      vi.resetModules();
    });

    it("should NOT log regular messages in production", async () => {
      const { logger } = await import("@/lib/logger");
      logger.log("test message");
      expect(console.log).not.toHaveBeenCalled();
    });

    it("should log errors in production (sanitized)", async () => {
      const { logger } = await import("@/lib/logger");
      logger.error("error message");
      expect(console.error).toHaveBeenCalledWith("error message");
    });

    it("should NOT log warnings in production", async () => {
      const { logger } = await import("@/lib/logger");
      logger.warn("warn message");
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("should NOT log info in production", async () => {
      const { logger } = await import("@/lib/logger");
      logger.info("info message");
      expect(console.info).not.toHaveBeenCalled();
    });

    it("should NOT log debug in production", async () => {
      const { logger } = await import("@/lib/logger");
      logger.debug("debug message");
      expect(console.debug).not.toHaveBeenCalled();
    });

    it("should sanitize sensitive data in production errors", async () => {
      const { logger } = await import("@/lib/logger");
      const sensitiveData = {
        username: "john",
        password: "secret123",
        api_key: "abc123",
      };
      logger.error("error with data", sensitiveData);

      // Should be called, but password and api_key should be stripped
      expect(console.error).toHaveBeenCalled();
      const calls = vi.mocked(console.error).mock.calls;
      const lastCall = calls[calls.length - 1];
      const loggedData = lastCall?.[1] as Record<string, unknown> | undefined;

      expect(loggedData?.username).toBe("john");
      expect(loggedData?.password).toBeUndefined();
      expect(loggedData?.api_key).toBeUndefined();
    });

    it("should recursively sanitize nested objects", async () => {
      const { logger } = await import("@/lib/logger");
      const nestedData = {
        user: {
          name: "john",
          credentials: {
            password: "secret123",
            token: "abc123",
          },
          profile: {
            email: "john@example.com",
          },
        },
      };
      logger.error("error with nested data", nestedData);

      expect(console.error).toHaveBeenCalled();
      const calls = vi.mocked(console.error).mock.calls;
      const lastCall = calls[calls.length - 1];
      const loggedData = lastCall?.[1] as {
        user?: {
          name?: string;
          credentials?: { password?: string; token?: string };
          profile?: { email?: string };
        };
      };

      expect(loggedData?.user?.name).toBe("john");
      expect(loggedData?.user?.profile?.email).toBe("john@example.com");
      expect(loggedData?.user?.credentials?.password).toBeUndefined();
      expect(loggedData?.user?.credentials?.token).toBeUndefined();
    });

    it("should sanitize arrays containing objects", async () => {
      const { logger } = await import("@/lib/logger");
      const arrayData = {
        users: [
          { name: "john", password: "secret1" },
          { name: "jane", password: "secret2" },
        ],
      };
      logger.error("error with array data", arrayData);

      expect(console.error).toHaveBeenCalled();
      const calls = vi.mocked(console.error).mock.calls;
      const lastCall = calls[calls.length - 1];
      const loggedData = lastCall?.[1] as {
        users?: Array<{ name?: string; password?: string }>;
      };

      expect(loggedData?.users).toHaveLength(2);
      expect(loggedData?.users?.[0]?.name).toBe("john");
      expect(loggedData?.users?.[0]?.password).toBeUndefined();
      expect(loggedData?.users?.[1]?.name).toBe("jane");
      expect(loggedData?.users?.[1]?.password).toBeUndefined();
    });

    it("should filter out functions from objects", async () => {
      const { logger } = await import("@/lib/logger");
      const dataWithFunction = {
        name: "john",
        callback: () => "should be removed",
        nested: {
          value: 42,
          handler() {
            return "also removed";
          },
        },
      };
      logger.error("error with functions", dataWithFunction);

      expect(console.error).toHaveBeenCalled();
      const calls = vi.mocked(console.error).mock.calls;
      const lastCall = calls[calls.length - 1];
      const loggedData = lastCall?.[1] as {
        name?: string;
        callback?: unknown;
        nested?: { value?: number; handler?: unknown };
      };

      expect(loggedData?.name).toBe("john");
      expect(loggedData?.callback).toBeUndefined();
      expect(loggedData?.nested?.value).toBe(42);
      expect(loggedData?.nested?.handler).toBeUndefined();
    });

    it("should filter functions from arrays", async () => {
      const { logger } = await import("@/lib/logger");
      const dataWithArrayFunctions = {
        items: [1, "two", () => "function", { value: 3 }],
      };
      logger.error("error with array functions", dataWithArrayFunctions);

      expect(console.error).toHaveBeenCalled();
      const calls = vi.mocked(console.error).mock.calls;
      const lastCall = calls[calls.length - 1];
      const loggedData = lastCall?.[1] as { items?: unknown[] };

      // Function should be filtered out
      expect(loggedData?.items).toHaveLength(3);
      expect(loggedData?.items).toContain(1);
      expect(loggedData?.items).toContain("two");
      expect(loggedData?.items).toContainEqual({ value: 3 });
    });

    it("should sanitize top-level arrays", async () => {
      const { logger } = await import("@/lib/logger");
      const arrayArg = [
        { name: "john", secret: "abc" },
        { name: "jane", token: "xyz" },
      ];
      logger.error("error with array arg", arrayArg);

      expect(console.error).toHaveBeenCalled();
      const calls = vi.mocked(console.error).mock.calls;
      const lastCall = calls[calls.length - 1];
      const loggedArray = lastCall?.[1] as Array<{
        name?: string;
        secret?: string;
        token?: string;
      }>;

      expect(loggedArray).toHaveLength(2);
      expect(loggedArray?.[0]?.name).toBe("john");
      expect(loggedArray?.[0]?.secret).toBeUndefined();
      expect(loggedArray?.[1]?.name).toBe("jane");
      expect(loggedArray?.[1]?.token).toBeUndefined();
    });

    it("should sanitize keys containing sensitive substrings", async () => {
      const { logger } = await import("@/lib/logger");
      const dataWithSubstrings = {
        username: "john",
        user_password: "secret",
        authToken: "abc",
        myApiKey: "xyz",
        privateData: "hidden",
      };
      logger.error("error with substring keys", dataWithSubstrings);

      expect(console.error).toHaveBeenCalled();
      const calls = vi.mocked(console.error).mock.calls;
      const lastCall = calls[calls.length - 1];
      const loggedData = lastCall?.[1] as Record<string, unknown>;

      expect(loggedData?.username).toBe("john");
      expect(loggedData?.user_password).toBeUndefined();
      expect(loggedData?.authToken).toBeUndefined();
      expect(loggedData?.myApiKey).toBeUndefined();
      expect(loggedData?.privateData).toBeUndefined();
    });
  });

  describe("errorTracker", () => {
    it("should export errorTracker instance", async () => {
      const { errorTracker } = await import("@/lib/logger");
      expect(errorTracker).toBeDefined();
      expect(typeof errorTracker.init).toBe("function");
      expect(typeof errorTracker.captureException).toBe("function");
      expect(typeof errorTracker.captureMessage).toBe("function");
    });

    it("should call tracking service when initialized", async () => {
      (process.env as { NODE_ENV: string }).NODE_ENV = "production";
      vi.resetModules();

      const { logger, errorTracker } = await import("@/lib/logger");
      const mockService = {
        captureException: vi.fn(),
        captureMessage: vi.fn(),
      };
      errorTracker.init(mockService);

      const error = new Error("test error");
      logger.error(error);

      expect(mockService.captureException).toHaveBeenCalledWith(
        error,
        undefined
      );
    });

    it("should call captureMessage for string errors", async () => {
      (process.env as { NODE_ENV: string }).NODE_ENV = "production";
      vi.resetModules();

      const { logger, errorTracker } = await import("@/lib/logger");
      const mockService = {
        captureException: vi.fn(),
        captureMessage: vi.fn(),
      };
      errorTracker.init(mockService);

      logger.error("string error message", { extra: "context" });

      expect(mockService.captureMessage).toHaveBeenCalledWith(
        "string error message",
        "error",
        { extra: "context" }
      );
    });

    it("should sanitize context sent to error tracker", async () => {
      (process.env as { NODE_ENV: string }).NODE_ENV = "production";
      vi.resetModules();

      const { logger, errorTracker } = await import("@/lib/logger");
      const mockService = {
        captureException: vi.fn(),
        captureMessage: vi.fn(),
      };
      errorTracker.init(mockService);

      const error = new Error("test error");
      logger.error(error, { userId: "123", password: "secret" });

      expect(mockService.captureException).toHaveBeenCalled();
      const capturedContext = mockService.captureException.mock
        .calls[0]?.[1] as Record<string, unknown> | undefined;
      expect(capturedContext?.userId).toBe("123");
      expect(capturedContext?.password).toBeUndefined();
    });

    it("should handle error tracker failures gracefully", async () => {
      (process.env as { NODE_ENV: string }).NODE_ENV = "production";
      vi.resetModules();

      const { logger, errorTracker } = await import("@/lib/logger");
      const mockService = {
        captureException: vi.fn().mockImplementation(() => {
          throw new Error("tracking failed");
        }),
        captureMessage: vi.fn(),
      };
      errorTracker.init(mockService);

      // Should not throw
      expect(() => logger.error(new Error("test"))).not.toThrow();
      // Internal error should be logged
      expect(console.error).toHaveBeenCalledWith(
        "[Logger Internal Error]",
        "Error tracking failed:",
        expect.any(Error)
      );
    });
  });
});

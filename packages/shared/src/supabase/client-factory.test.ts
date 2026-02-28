import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "../logger";

import { handleSupabaseCookieWriteFailure } from "./cookie-write-failure";

describe("handleSupabaseCookieWriteFailure", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const setNodeEnv = (value: string | undefined) => {
    (process.env as Record<string, string | undefined>).NODE_ENV = value;
  };

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
    vi.restoreAllMocks();
  });

  it("throws in development to fail loudly", () => {
    setNodeEnv("development");

    expect(() =>
      handleSupabaseCookieWriteFailure({
        error: new Error("cookie write blocked"),
        cookieCount: 2,
        context: "test-context",
      })
    ).toThrow("Supabase cookie write skipped");
  });

  it("logs structured warning in production-like environments", () => {
    setNodeEnv("production");
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

    handleSupabaseCookieWriteFailure({
      error: new Error("cookie write blocked"),
      cookieCount: 3,
      context: "test-context",
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Supabase cookie write skipped"),
      expect.objectContaining({
        event: "supabase_cookie_write_skipped",
        cookieCount: 3,
        context: "test-context",
      })
    );
  });
});

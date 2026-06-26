import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "../logger";

import {
  createServerMutatingSupabaseClient,
  createServerSupabaseClient,
} from "./client-factory";
import { handleSupabaseCookieWriteFailure } from "./cookie-write-failure";
import { AUTH_REFRESHED_HEADER_NAME } from "./refresh-auth-session-in-proxy";

const { createServerClientMock, cookiesMock, headersMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
  headers: headersMock,
}));

vi.mock("../env-validation", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getSupabaseKey: () => "anon-key",
}));

const cookieSetSpy = vi.fn(() => {
  throw new Error("Cookies can only be modified in a Server Action");
});

describe("createServerSupabaseClient", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    createServerClientMock.mockReset();
    cookieSetSpy.mockClear();
    (process.env as Record<string, string | undefined>).NODE_ENV =
      "development";
    cookiesMock.mockResolvedValue({
      getAll: () => [],
      set: cookieSetSpy,
    });
    headersMock.mockResolvedValue(new Headers());
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV =
      originalNodeEnv;
  });

  it("wires a fetch timeout on the read-only server client", async () => {
    let capturedOptions: { global?: { fetch?: unknown } } | undefined;
    createServerClientMock.mockImplementation((_url, _key, options) => {
      capturedOptions = options;
      return {};
    });

    await createServerSupabaseClient();

    expect(typeof capturedOptions?.global?.fetch).toBe("function");
  });

  it("wires a fetch timeout on the mutating server client", async () => {
    let capturedOptions: { global?: { fetch?: unknown } } | undefined;
    createServerClientMock.mockImplementation((_url, _key, options) => {
      capturedOptions = options;
      return {};
    });

    await createServerMutatingSupabaseClient();

    expect(typeof capturedOptions?.global?.fetch).toBe("function");
  });

  it("no-ops setAll when the proxy already refreshed the session", async () => {
    headersMock.mockResolvedValue(
      new Headers({ [AUTH_REFRESHED_HEADER_NAME]: "1" })
    );

    let capturedSetAll:
      | ((cookies: unknown[], headers?: Record<string, string>) => void)
      | undefined;
    createServerClientMock.mockImplementation((_url, _key, options) => {
      capturedSetAll = options.cookies.setAll;
      return {};
    });

    await createServerSupabaseClient();

    expect(capturedSetAll).toBeDefined();
    expect(() =>
      capturedSetAll?.(
        [{ name: "sb-example-auth-token", value: "token", options: {} }],
        { "Cache-Control": "no-cache, no-store" }
      )
    ).not.toThrow();
    expect(cookieSetSpy).not.toHaveBeenCalled();
  });

  it("attempts cookie writes when the proxy did not refresh the session", async () => {
    let capturedSetAll: ((cookies: unknown[]) => void) | undefined;
    createServerClientMock.mockImplementation((_url, _key, options) => {
      capturedSetAll = options.cookies.setAll;
      return {};
    });

    await createServerSupabaseClient();

    expect(() =>
      capturedSetAll?.([
        { name: "sb-example-auth-token", value: "token", options: {} },
      ])
    ).toThrow("Supabase cookie write skipped");
    expect(cookieSetSpy).toHaveBeenCalled();
  });

  it("writes cookies when allowCookieWrites is set despite x-helvety-auth-refreshed", async () => {
    headersMock.mockResolvedValue(
      new Headers({ [AUTH_REFRESHED_HEADER_NAME]: "1" })
    );
    const allowCookieSetSpy = vi.fn();
    cookiesMock.mockResolvedValue({
      getAll: () => [],
      set: allowCookieSetSpy,
    });

    let capturedSetAll: ((cookies: unknown[]) => void) | undefined;
    createServerClientMock.mockImplementation((_url, _key, options) => {
      capturedSetAll = options.cookies.setAll;
      return {};
    });

    await createServerMutatingSupabaseClient();

    capturedSetAll?.([
      { name: "sb-example-auth-token", value: "token", options: {} },
    ]);
    expect(allowCookieSetSpy).toHaveBeenCalled();
  });

  it("no-ops setAll in production when the proxy already refreshed the session", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    headersMock.mockResolvedValue(
      new Headers({ [AUTH_REFRESHED_HEADER_NAME]: "1" })
    );

    let capturedSetAll: ((cookies: unknown[]) => void) | undefined;
    createServerClientMock.mockImplementation((_url, _key, options) => {
      capturedSetAll = options.cookies.setAll;
      return {};
    });

    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

    await createServerSupabaseClient();

    expect(() =>
      capturedSetAll?.([
        { name: "sb-example-auth-token", value: "token", options: {} },
      ])
    ).not.toThrow();
    expect(cookieSetSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

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

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BROWSER_SUPABASE_FETCH_TIMEOUT_MS,
  SERVER_SUPABASE_FETCH_TIMEOUT_MS,
  browserFetchWithTimeout,
  createFetchWithTimeout,
  serverFetchWithTimeout,
} from "./fetch-with-timeout";

/** Sentinel response so tests do not depend on a real `Response` constructor. */
const OK_RESPONSE = { ok: true } as unknown as Response;

describe("createFetchWithTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resolves with the response and passes an abort signal through", async () => {
    let capturedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      capturedSignal = init?.signal ?? undefined;
      return OK_RESPONSE;
    });
    vi.stubGlobal("fetch", fetchMock);

    const fetchWithTimeout = createFetchWithTimeout(1_000);
    const response = await fetchWithTimeout("https://example.test");

    expect(response).toBe(OK_RESPONSE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(capturedSignal).toBeInstanceOf(AbortSignal);
    expect(capturedSignal?.aborted).toBe(false);
  });

  it("aborts the request after the timeout elapses", async () => {
    vi.useFakeTimers();

    let capturedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn(
      (_input: unknown, init?: RequestInit) =>
        new Promise<Response>(() => {
          capturedSignal = init?.signal ?? undefined;
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const fetchWithTimeout = createFetchWithTimeout(5_000);
    void fetchWithTimeout("https://example.test");

    expect(capturedSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("does not abort after a successful response (timer is cleared)", async () => {
    vi.useFakeTimers();

    let capturedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      capturedSignal = init?.signal ?? undefined;
      return OK_RESPONSE;
    });
    vi.stubGlobal("fetch", fetchMock);

    const fetchWithTimeout = createFetchWithTimeout(5_000);
    await fetchWithTimeout("https://example.test");

    await vi.advanceTimersByTimeAsync(10_000);
    expect(capturedSignal?.aborted).toBe(false);
  });

  it("aborts when the caller's signal aborts", async () => {
    let capturedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn(
      (_input: unknown, init?: RequestInit) =>
        new Promise<Response>(() => {
          capturedSignal = init?.signal ?? undefined;
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const callerController = new AbortController();
    const fetchWithTimeout = createFetchWithTimeout(60_000);
    void fetchWithTimeout("https://example.test", {
      signal: callerController.signal,
    });

    expect(capturedSignal?.aborted).toBe(false);
    callerController.abort();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("preserves caller init fields other than the signal", async () => {
    let capturedInit: RequestInit | undefined;
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      capturedInit = init;
      return OK_RESPONSE;
    });
    vi.stubGlobal("fetch", fetchMock);

    const fetchWithTimeout = createFetchWithTimeout(1_000);
    await fetchWithTimeout("https://example.test", {
      method: "POST",
      headers: { "x-test": "1" },
    });

    expect(capturedInit?.method).toBe("POST");
    expect(capturedInit?.headers).toEqual({ "x-test": "1" });
  });
});

describe("exported fetch-with-timeout helpers", () => {
  it("exposes browser and server helpers as functions", () => {
    expect(typeof browserFetchWithTimeout).toBe("function");
    expect(typeof serverFetchWithTimeout).toBe("function");
  });

  it("uses a longer browser timeout than the server timeout", () => {
    expect(BROWSER_SUPABASE_FETCH_TIMEOUT_MS).toBe(15_000);
    expect(SERVER_SUPABASE_FETCH_TIMEOUT_MS).toBe(8_000);
    expect(SERVER_SUPABASE_FETCH_TIMEOUT_MS).toBeLessThan(
      BROWSER_SUPABASE_FETCH_TIMEOUT_MS
    );
  });
});

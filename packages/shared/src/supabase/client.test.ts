import { afterEach, describe, expect, it, vi } from "vitest";

const createSSRBrowserClientMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createSSRBrowserClientMock,
}));
vi.mock("../env-validation", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getSupabaseKey: () => "sb_publishable_test_1234567890",
}));

describe("supabase browser lock fallback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    createSSRBrowserClientMock.mockReset();
  });

  it("serializes concurrent auth callbacks when navigator.locks is unavailable", async () => {
    createSSRBrowserClientMock.mockReturnValue({});
    const originalLocks = navigator.locks;
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: undefined,
    });

    try {
      const { createBrowserClient } = await import("./client");
      createBrowserClient();
      const [, , options] = createSSRBrowserClientMock.mock.calls[0] as [
        string,
        string,
        {
          auth: {
            lock: <R>(
              name: string,
              acquireTimeout: number,
              fn: () => Promise<R>
            ) => Promise<R>;
          };
        },
      ];
      const lock = options.auth.lock;

      let activeCount = 0;
      let peakConcurrent = 0;

      const runCriticalSection = (value: number) =>
        lock("auth-test", 1_000, async () => {
          activeCount += 1;
          peakConcurrent = Math.max(peakConcurrent, activeCount);
          await new Promise((resolve) => setTimeout(resolve, 20));
          activeCount -= 1;
          return value;
        });

      const [first, second] = await Promise.all([
        runCriticalSection(1),
        runCriticalSection(2),
      ]);

      expect(first).toBe(1);
      expect(second).toBe(2);
      expect(peakConcurrent).toBe(1);
    } finally {
      Object.defineProperty(navigator, "locks", {
        configurable: true,
        value: originalLocks,
      });
    }
  });

  it("times out while waiting on in-memory lock queue", async () => {
    createSSRBrowserClientMock.mockReturnValue({});
    const originalLocks = navigator.locks;
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: undefined,
    });

    try {
      const { createBrowserClient } = await import("./client");
      createBrowserClient();
      const [, , options] = createSSRBrowserClientMock.mock.calls[0] as [
        string,
        string,
        {
          auth: {
            lock: <R>(
              name: string,
              acquireTimeout: number,
              fn: () => Promise<R>
            ) => Promise<R>;
          };
        },
      ];
      const lock = options.auth.lock;

      let releaseFirst = () => {};
      const first = lock("auth-test", 1_000, async () => {
        await new Promise<void>((resolve) => {
          releaseFirst = () => resolve();
        });
      });

      await expect(
        lock("auth-test", 10, async () => "second")
      ).rejects.toThrowError("Timed out waiting for auth lock");

      releaseFirst();
      await first;
    } finally {
      Object.defineProperty(navigator, "locks", {
        configurable: true,
        value: originalLocks,
      });
    }
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

const createSSRBrowserClientMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createSSRBrowserClientMock,
}));
vi.mock("../client-env", () => ({
  getClientSupabaseUrl: () => "https://example.supabase.co",
  getClientSupabaseKey: () => "sb_publishable_test_1234567890",
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
      let releaseFirst = () => {};
      let resolveFirstEntered = () => {};
      const firstEntered = new Promise<void>((resolve) => {
        resolveFirstEntered = () => resolve();
      });

      const runCriticalSection = (value: number) =>
        lock("auth-test", 1_000, async () => {
          activeCount += 1;
          peakConcurrent = Math.max(peakConcurrent, activeCount);
          if (value === 1) {
            await new Promise<void>((resolve) => {
              resolveFirstEntered();
              releaseFirst = () => resolve();
            });
          }
          activeCount -= 1;
          return value;
        });

      const firstPromise = runCriticalSection(1);
      const secondPromise = runCriticalSection(2);

      // Allow first lock holder to complete; second should enter only afterwards.
      await firstEntered;
      releaseFirst();

      const [first, second] = await Promise.all([firstPromise, secondPromise]);

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

  it("wires a fetch timeout on the browser client", async () => {
    createSSRBrowserClientMock.mockReturnValue({});

    const { createBrowserClient } = await import("./client");
    createBrowserClient();

    const [, , options] = createSSRBrowserClientMock.mock.calls[0] as [
      string,
      string,
      { global?: { fetch?: unknown } },
    ];

    expect(typeof options.global?.fetch).toBe("function");
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

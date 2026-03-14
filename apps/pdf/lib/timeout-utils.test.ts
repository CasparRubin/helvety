import { afterEach, describe, expect, it, vi } from "vitest";

import { withTimeout, withTimeoutAndSignal } from "./timeout-utils";

afterEach(() => {
  vi.useRealTimers();
});

describe("withTimeout", () => {
  it("resolves when promise finishes in time", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 100)).resolves.toBe("ok");
  });

  it("rejects on timeout", async () => {
    vi.useFakeTimers();
    const never = new Promise<string>(() => {
      // intentionally unresolved
    });

    const timeoutPromise = withTimeout(never, 5, "Timed out");
    const assertion = expect(timeoutPromise).rejects.toThrow("Timed out");
    await vi.advanceTimersByTimeAsync(5);
    await assertion;
  });
});

describe("withTimeoutAndSignal", () => {
  it("rejects immediately when signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      withTimeoutAndSignal(
        async () => "ok",
        100,
        controller.signal,
        "Should not matter"
      )
    ).rejects.toThrow("Operation cancelled");
  });

  it("rejects when aborted during execution", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve("late"), 50);
    });

    setTimeout(() => controller.abort(), 5);

    const operation = withTimeoutAndSignal(
      () => slow,
      100,
      controller.signal,
      "Timed out"
    );
    const assertion = expect(operation).rejects.toThrow("Operation cancelled");
    await vi.advanceTimersByTimeAsync(5);
    await assertion;
  });

  it("resolves when not aborted and within timeout", async () => {
    const controller = new AbortController();

    await expect(
      withTimeoutAndSignal(
        async () => "done",
        100,
        controller.signal,
        "Timed out"
      )
    ).resolves.toBe("done");
  });
});

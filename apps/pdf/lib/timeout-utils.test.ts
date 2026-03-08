import { describe, expect, it } from "vitest";

import { withTimeout, withTimeoutAndSignal } from "./timeout-utils";

describe("withTimeout", () => {
  it("resolves when promise finishes in time", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 100)).resolves.toBe("ok");
  });

  it("rejects on timeout", async () => {
    const never = new Promise<string>(() => {
      // intentionally unresolved
    });

    await expect(withTimeout(never, 5, "Timed out")).rejects.toThrow(
      "Timed out"
    );
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
    const controller = new AbortController();
    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve("late"), 50);
    });

    setTimeout(() => controller.abort(), 5);

    await expect(
      withTimeoutAndSignal(() => slow, 100, controller.signal, "Timed out")
    ).rejects.toThrow("Operation cancelled");
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

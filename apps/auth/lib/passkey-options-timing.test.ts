import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ensurePasskeyOptionsMinDuration,
  PASSKEY_OPTIONS_MIN_DURATION_MS,
} from "./passkey-options-timing";

describe("passkey-options-timing", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits until minimum duration elapses", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const pending = ensurePasskeyOptionsMinDuration(0);
    vi.advanceTimersByTime(100);
    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    vi.advanceTimersByTime(PASSKEY_OPTIONS_MIN_DURATION_MS - 100);
    await pending;
    expect(settled).toBe(true);
  });

  it("does not wait when elapsed time already exceeds the minimum", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(PASSKEY_OPTIONS_MIN_DURATION_MS + 50);
    const pending = ensurePasskeyOptionsMinDuration(0);
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });
});

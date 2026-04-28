import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  __prfSaltCacheInternals,
  cachePRFSalt,
  clearCachedPRFSalt,
  getCachedPRFSalt,
} from "./prf-salt-cache";

describe("prf-salt-cache", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("returns cached value before max age", () => {
    cachePRFSalt("salt-value", 1);

    expect(getCachedPRFSalt()).toMatchObject({
      prfSalt: "salt-value",
      version: 1,
    });
  });

  it("expires stale cache entries and clears storage", () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    cachePRFSalt("salt-value", 1);
    vi.setSystemTime(
      now + __prfSaltCacheInternals.PRF_SALT_CACHE_MAX_AGE_MS + 1
    );

    expect(getCachedPRFSalt()).toBeNull();
    expect(localStorage.getItem("helvety-prf-salt")).toBeNull();
  });

  it("clears cached salt explicitly", () => {
    cachePRFSalt("salt-value", 1);
    clearCachedPRFSalt();

    expect(getCachedPRFSalt()).toBeNull();
  });
});

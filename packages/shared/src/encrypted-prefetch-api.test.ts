import { describe, expect, it } from "vitest";

import {
  CONTACT_LINK_PICKER_COLUMNS,
  ENCRYPTED_PREFETCH_COLUMNS,
  ENCRYPTED_PREFETCH_READ_RATE_LIMIT,
  encryptedPrefetchAuthOptions,
} from "./encrypted-prefetch-api";
import { RATE_LIMITS } from "./rate-limit";

describe("encryptedPrefetchAuthOptions", () => {
  it("uses PREFETCH read rate limits for list GET routes", () => {
    expect(encryptedPrefetchAuthOptions("contacts")).toEqual({
      rateLimitPrefix: "contacts",
      readRateLimitConfig: RATE_LIMITS.PREFETCH,
    });
    expect(ENCRYPTED_PREFETCH_READ_RATE_LIMIT).toBe(RATE_LIMITS.PREFETCH);
  });
});

describe("ENCRYPTED_PREFETCH_COLUMNS", () => {
  it("lists explicit columns for each encrypted entity table", () => {
    for (const columns of Object.values(ENCRYPTED_PREFETCH_COLUMNS)) {
      expect(columns.length).toBeGreaterThan(0);
      expect(columns).not.toContain("*");
    }

    expect(ENCRYPTED_PREFETCH_COLUMNS.contacts).toContain(
      "encrypted_first_name"
    );
    expect(ENCRYPTED_PREFETCH_COLUMNS.items).toContain("encrypted_title");
    expect(ENCRYPTED_PREFETCH_COLUMNS.notes).toContain("encrypted_title");
    expect(ENCRYPTED_PREFETCH_COLUMNS.link_folders).toContain("encrypted_name");
    expect(ENCRYPTED_PREFETCH_COLUMNS.links).toContain("encrypted_url");
  });
});

describe("CONTACT_LINK_PICKER_COLUMNS", () => {
  it("is a slim explicit subset of contact prefetch columns", () => {
    expect(CONTACT_LINK_PICKER_COLUMNS).not.toContain("*");
    for (const column of CONTACT_LINK_PICKER_COLUMNS.split(",")) {
      expect(ENCRYPTED_PREFETCH_COLUMNS.contacts).toContain(column);
    }
  });
});

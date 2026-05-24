import { describe, expect, it } from "vitest";

import {
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
    expect(ENCRYPTED_PREFETCH_COLUMNS.contacts).toContain(
      "encrypted_first_name"
    );
    expect(ENCRYPTED_PREFETCH_COLUMNS.contacts).not.toContain("*");
    expect(ENCRYPTED_PREFETCH_COLUMNS.docs).toContain("encrypted_docx");
  });
});

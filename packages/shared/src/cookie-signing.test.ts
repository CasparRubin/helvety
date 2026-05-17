import { afterEach, describe, expect, it } from "vitest";

import { signCookiePayload, verifySignedCookiePayload } from "./cookie-signing";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("cookie-signing", () => {
  it("requires HELVETY_COOKIE_SIGNING_SECRET and does not fall back to SUPABASE_SECRET_KEY", async () => {
    delete process.env.HELVETY_COOKIE_SIGNING_SECRET;
    process.env.SUPABASE_SECRET_KEY = "x".repeat(60);

    await expect(signCookiePayload("payload")).rejects.toThrow(
      /HELVETY_COOKIE_SIGNING_SECRET/i
    );
  });

  it("signs and verifies payloads with HELVETY_COOKIE_SIGNING_SECRET", async () => {
    process.env.HELVETY_COOKIE_SIGNING_SECRET =
      "test_cookie_signing_secret_for_unit_tests_1234567890";

    const signed = await signCookiePayload('{"challenge":"abc"}');
    expect(signed).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

    await expect(verifySignedCookiePayload(signed)).resolves.toBe(
      '{"challenge":"abc"}'
    );
    await expect(verifySignedCookiePayload(`${signed}tampered`)).resolves.toBe(
      null
    );
  });
});

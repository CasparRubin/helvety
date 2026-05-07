import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieState = { value: undefined as string | undefined };
  const cookieStore = {
    get: vi.fn(() =>
      cookieState.value
        ? { name: "csrf_token", value: cookieState.value }
        : undefined
    ),
    set: vi.fn((_name: string, value: string) => {
      cookieState.value = value;
    }),
  };
  return { cookieState, cookieStore };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mocks.cookieStore),
}));

import {
  generateCSRFToken,
  getCSRFTokenFromCookieValue,
  validateCSRFToken,
} from "./csrf";

describe("csrf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieState.value = undefined;
    process.env.SUPABASE_SECRET_KEY =
      "test_supabase_secret_key_for_csrf_signing_1234567890";
  });

  it("generates a signed cookie and validates matching token", async () => {
    const token = await generateCSRFToken();
    const cookieValue = mocks.cookieState.value;

    expect(token).toMatch(/^[0-9a-f]{64}$/i);
    expect(cookieValue).toBeTruthy();
    expect(cookieValue).not.toBe(token);

    await expect(validateCSRFToken(token)).resolves.toBe(true);
  });

  it("rejects tampered cookie payloads", async () => {
    const token = await generateCSRFToken();
    const original = mocks.cookieState.value ?? "";
    mocks.cookieState.value = `${original}x`;

    await expect(validateCSRFToken(token)).resolves.toBe(false);
    await expect(
      getCSRFTokenFromCookieValue(mocks.cookieState.value)
    ).resolves.toBeNull();
  });
});

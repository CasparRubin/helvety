import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAllowedChromeExtensionOrigin: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/chrome-extension-origin", () => ({
  isAllowedChromeExtensionOrigin: mocks.isAllowedChromeExtensionOrigin,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    warn: mocks.warn,
  },
}));

import {
  EXTENSION_INVALID_REQUEST_BODY_ERROR,
  EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR,
  extensionOriginParseBodyError,
  extensionOriginRejectedError,
  extensionOriginRejectedResponse,
  extractExtensionOriginFromBody,
} from "./extension-auth-errors";

const ALLOWED_ORIGIN = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";
const BLOCKED_ORIGIN = "chrome-extension://notonthelistabcdefghijklmnop";

describe("extension-auth-errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts origin from body objects", () => {
    expect(
      extractExtensionOriginFromBody({ origin: ALLOWED_ORIGIN, email: "a@b.c" })
    ).toBe(ALLOWED_ORIGIN);
    expect(extractExtensionOriginFromBody({ email: "a@b.c" })).toBeNull();
  });

  it("returns invalid body when origin is missing or not chrome-extension", () => {
    expect(extensionOriginParseBodyError(null)).toBe(
      EXTENSION_INVALID_REQUEST_BODY_ERROR
    );
    expect(extensionOriginParseBodyError("https://evil.example")).toBe(
      EXTENSION_INVALID_REQUEST_BODY_ERROR
    );
  });

  it("returns allowlist user error only when chrome-extension origin is disallowed", () => {
    mocks.isAllowedChromeExtensionOrigin.mockReturnValue(false);

    expect(extensionOriginParseBodyError(BLOCKED_ORIGIN)).toBe(
      EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR
    );
    expect(mocks.warn).toHaveBeenCalled();
  });

  it("returns invalid body when origin is allowlisted but other fields failed Zod", () => {
    mocks.isAllowedChromeExtensionOrigin.mockReturnValue(true);

    expect(extensionOriginParseBodyError(ALLOWED_ORIGIN)).toBe(
      EXTENSION_INVALID_REQUEST_BODY_ERROR
    );
    expect(mocks.warn).not.toHaveBeenCalled();
  });

  it("extensionOriginRejectedResponse returns null for allowlisted origins", () => {
    mocks.isAllowedChromeExtensionOrigin.mockReturnValue(true);
    expect(extensionOriginRejectedResponse(ALLOWED_ORIGIN)).toBeNull();
  });

  it("extensionOriginRejectedResponse returns user error for disallowed origins", () => {
    mocks.isAllowedChromeExtensionOrigin.mockReturnValue(false);
    expect(extensionOriginRejectedResponse(BLOCKED_ORIGIN)).toEqual({
      success: false,
      error: EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR,
    });
  });

  it("extensionOriginRejectedError returns user error for disallowed chrome-extension origins", () => {
    mocks.isAllowedChromeExtensionOrigin.mockReturnValue(false);
    expect(extensionOriginRejectedError(BLOCKED_ORIGIN)).toBe(
      EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR
    );
    expect(mocks.warn).toHaveBeenCalledWith(
      "Extension origin not allowlisted",
      expect.objectContaining({
        extensionId: "notonthelistabcdefghijklmnop",
        envVar: "HELVETY_CHROME_EXTENSION_ORIGINS",
      })
    );
  });

  it("extensionOriginRejectedError returns null for non-extension origins", () => {
    mocks.isAllowedChromeExtensionOrigin.mockReturnValue(false);
    expect(extensionOriginRejectedError("https://evil.example")).toBeNull();
  });
});

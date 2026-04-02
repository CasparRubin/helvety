import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOwnPasskeyStatus: vi.fn(),
  hasEncryptionSetup: vi.fn(),
}));

vi.mock("@/app/actions/credential-actions", () => ({
  getOwnPasskeyStatus: mocks.getOwnPasskeyStatus,
}));

vi.mock("@/app/actions/encryption-actions", () => ({
  hasEncryptionSetup: mocks.hasEncryptionSetup,
}));

import { getRequiredAuthStep } from "./auth-utils";

describe("auth-utils getRequiredAuthStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok passkey-signin when passkey and encryption exist", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: true,
      data: { hasPasskey: true, count: 1 },
    });
    mocks.hasEncryptionSetup.mockResolvedValue({ success: true, data: true });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      status: "ok",
      step: "passkey-signin",
      hasPasskey: true,
      hasEncryption: true,
    });
  });

  it("returns ok encryption-setup when passkey is missing", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: true,
      data: { hasPasskey: false, count: 0 },
    });
    mocks.hasEncryptionSetup.mockResolvedValue({ success: true, data: false });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      status: "ok",
      step: "encryption-setup",
      hasPasskey: false,
      hasEncryption: false,
    });
  });

  it("returns ok encryption-setup when passkey exists but encryption params do not", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: true,
      data: { hasPasskey: true, count: 1 },
    });
    mocks.hasEncryptionSetup.mockResolvedValue({ success: true, data: false });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      status: "ok",
      step: "encryption-setup",
      hasPasskey: true,
      hasEncryption: false,
    });
  });

  it("returns not_authenticated when passkey check reports not authenticated", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: false,
      error: "Not authenticated",
    });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      status: "not_authenticated",
    });
    expect(mocks.hasEncryptionSetup).not.toHaveBeenCalled();
  });

  it("returns unavailable when passkey check fails with server error", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: false,
      error: "Failed to check passkey status",
    });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      status: "unavailable",
      message: "Failed to check passkey status",
    });
    expect(mocks.hasEncryptionSetup).not.toHaveBeenCalled();
  });

  it("returns not_authenticated when encryption check reports not authenticated", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: true,
      data: { hasPasskey: true, count: 1 },
    });
    mocks.hasEncryptionSetup.mockResolvedValue({
      success: false,
      error: "Not authenticated",
    });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      status: "not_authenticated",
    });
  });

  it("returns unavailable when encryption check fails with server error", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: true,
      data: { hasPasskey: true, count: 1 },
    });
    mocks.hasEncryptionSetup.mockResolvedValue({
      success: false,
      error: "Failed to check encryption status",
    });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      status: "unavailable",
      message: "Failed to check encryption status",
    });
  });
});

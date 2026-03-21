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

  it("returns passkey-signin when passkey and encryption exist", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: true,
      data: { hasPasskey: true, count: 1 },
    });
    mocks.hasEncryptionSetup.mockResolvedValue({ success: true, data: true });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      step: "passkey-signin",
      hasPasskey: true,
      hasEncryption: true,
    });
  });

  it("returns encryption-setup when passkey is missing", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: true,
      data: { hasPasskey: false, count: 0 },
    });
    mocks.hasEncryptionSetup.mockResolvedValue({ success: true, data: false });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      step: "encryption-setup",
      hasPasskey: false,
      hasEncryption: false,
    });
  });

  it("returns encryption-setup when passkey exists but encryption params do not", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: true,
      data: { hasPasskey: true, count: 1 },
    });
    mocks.hasEncryptionSetup.mockResolvedValue({ success: true, data: false });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      step: "encryption-setup",
      hasPasskey: true,
      hasEncryption: false,
    });
  });

  it("treats failed passkey status check as no passkey (encryption-setup)", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: false,
      error: "Failed to check passkey status",
    });
    mocks.hasEncryptionSetup.mockResolvedValue({ success: true, data: true });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      step: "encryption-setup",
      hasPasskey: false,
      hasEncryption: true,
    });
  });

  it("treats failed encryption check as no encryption (encryption-setup)", async () => {
    mocks.getOwnPasskeyStatus.mockResolvedValue({
      success: true,
      data: { hasPasskey: true, count: 1 },
    });
    mocks.hasEncryptionSetup.mockResolvedValue({
      success: false,
      error: "Failed to check encryption status",
    });

    await expect(getRequiredAuthStep()).resolves.toEqual({
      step: "encryption-setup",
      hasPasskey: true,
      hasEncryption: false,
    });
  });
});

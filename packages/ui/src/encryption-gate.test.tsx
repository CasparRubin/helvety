import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EncryptionGate } from "./encryption-gate";

const mocks = vi.hoisted(() => ({
  classifyActionAuthError: vi.fn(),
  redirectToLoginOnce: vi.fn(),
  triggerHardLogoutOnce: vi.fn(),
  checkEncryptionState: vi.fn(),
  lockEncryption: vi.fn(),
  getEncryptionParams: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
}));

vi.mock("@helvety/shared/auth-errors", () => ({
  classifyActionAuthError: mocks.classifyActionAuthError,
}));

vi.mock("@helvety/shared/crypto/encryption-context", () => ({
  useEncryptionContext: () => ({
    isUnlocked: false,
    isLoading: false,
    checkEncryptionState: mocks.checkEncryptionState,
    lockEncryption: mocks.lockEncryption,
    unlockedForUserId: null,
    error: null,
  }),
}));

vi.mock("@helvety/shared/crypto/key-storage", () => ({
  onKeyEvent: () => () => {},
}));

vi.mock("@helvety/shared/supabase/client", () => ({
  createBrowserClient: () => ({
    auth: {
      signOut: mocks.signOut,
      onAuthStateChange: mocks.onAuthStateChange,
    },
  }),
}));

vi.mock("./auth-navigation", () => ({
  redirectToLoginOnce: mocks.redirectToLoginOnce,
  triggerHardLogoutOnce: mocks.triggerHardLogoutOnce,
}));

describe("EncryptionGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkEncryptionState.mockResolvedValue(undefined);
    mocks.classifyActionAuthError.mockImplementation((error: string | null) =>
      error === "hard" ? "hard_logout" : "login"
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login when params check requests login", async () => {
    mocks.getEncryptionParams.mockResolvedValue({
      success: false,
      error: "login-needed",
    });

    render(
      <EncryptionGate
        userId="user-1"
        actions={{ getEncryptionParams: mocks.getEncryptionParams }}
      >
        <div>secure-content</div>
      </EncryptionGate>
    );

    await waitFor(() => {
      expect(mocks.redirectToLoginOnce).toHaveBeenCalled();
    });
    expect(mocks.triggerHardLogoutOnce).not.toHaveBeenCalled();
  });

  it("triggers hard logout when auth error is terminal", async () => {
    mocks.getEncryptionParams.mockResolvedValue({
      success: false,
      error: "hard",
    });

    render(
      <EncryptionGate
        userId="user-1"
        actions={{ getEncryptionParams: mocks.getEncryptionParams }}
      >
        <div>secure-content</div>
      </EncryptionGate>
    );

    await waitFor(() => {
      expect(mocks.triggerHardLogoutOnce).toHaveBeenCalled();
    });
    expect(mocks.redirectToLoginOnce).not.toHaveBeenCalled();
  });
});

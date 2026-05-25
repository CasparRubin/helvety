import { describe, expect, it } from "vitest";

import { EXTENSION_CHALLENGE_EXPIRY_MS } from "@/lib/extension-passkey-challenge";
import { WEBAUTHN_CHALLENGE_EXPIRY_MS } from "@/lib/webauthn-challenge-ttl";

describe("webauthn challenge TTL constants", () => {
  it("keeps extension and shared TTL aligned at 3 minutes", () => {
    expect(WEBAUTHN_CHALLENGE_EXPIRY_MS).toBe(3 * 60 * 1000);
    expect(EXTENSION_CHALLENGE_EXPIRY_MS).toBe(WEBAUTHN_CHALLENGE_EXPIRY_MS);
  });
});

import { describe, expect, it } from "vitest";

import { challengeFromClientDataJSON } from "./extension-passkey";

describe("challengeFromClientDataJSON", () => {
  it("extracts challenge from base64url clientDataJSON", () => {
    const challenge = "test-challenge-base64url";
    const clientDataJSON = Buffer.from(
      JSON.stringify({ type: "webauthn.get", challenge, origin: "https://x" }),
      "utf8"
    ).toString("base64url");

    expect(challengeFromClientDataJSON(clientDataJSON)).toBe(challenge);
  });
});

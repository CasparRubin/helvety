import { describe, expect, it } from "vitest";

import { verifyAuthActionGuards } from "../../../scripts/check-auth-server-action-guards.mjs";

describe("verifyAuthActionGuards", () => {
  it("skips helper modules and test files", () => {
    expect(
      verifyAuthActionGuards(
        "apps/auth/app/actions/auth-action-helpers.ts",
        '"use server";\nawait getAuthUser();'
      )
    ).toEqual([]);
    expect(
      verifyAuthActionGuards(
        "apps/auth/app/actions/credential-actions.test.ts",
        '"use server";\nawait getAuthUser();'
      )
    ).toEqual([]);
  });

  it("skips non server-action modules", () => {
    expect(
      verifyAuthActionGuards(
        "apps/auth/app/actions/foo.ts",
        "export function helper() {}"
      )
    ).toEqual([]);
  });

  it("allowlists login bootstrap reads without session guards", () => {
    const content = `"use server";
export async function getDeviceTrustStatus() {
  return { success: true, data: { trusted: false } };
}`;
    expect(
      verifyAuthActionGuards(
        "apps/auth/app/actions/device-trust-actions.ts",
        content
      )
    ).toEqual([]);
  });

  it("requires authenticateAndRateLimit on authenticated action modules", () => {
    const violations = verifyAuthActionGuards(
      "apps/auth/app/actions/credential-actions.ts",
      `"use server";
export async function getOwnPasskeyStatus() {
  return { success: true };
}`
    );
    expect(violations).toEqual([
      "apps/auth/app/actions/credential-actions.ts: authenticated server actions must use authenticateAndRateLimit",
    ]);
  });

  it("passes authenticated modules that call authenticateAndRateLimit", () => {
    const content = `"use server";
import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
export async function getOwnPasskeyStatus() {
  const auth = await authenticateAndRateLimit({});
  if (!auth.ok) return auth.response;
  return { success: true };
}`;
    expect(
      verifyAuthActionGuards(
        "apps/auth/app/actions/credential-actions.ts",
        content
      )
    ).toEqual([]);
  });

  it("requires pre-auth guard helpers on OTP and passkey sign-in modules", () => {
    const violations = verifyAuthActionGuards(
      "apps/auth/app/actions/otp-actions.ts",
      `"use server";
export async function sendEmailCode() {
  return { success: true };
}`
    );
    expect(violations).toEqual([
      "apps/auth/app/actions/otp-actions.ts: pre-auth server actions must use runAuthActionGuards or runRateLimitGuard",
    ]);
  });

  it("passes pre-auth modules that use runAuthActionGuards", () => {
    const content = `"use server";
import { runAuthActionGuards } from "@helvety/shared/action-helpers";
export async function sendEmailCode() {
  const guard = await runAuthActionGuards({});
  if (!guard.ok) return guard.response;
  return { success: true };
}`;
    expect(
      verifyAuthActionGuards("apps/auth/app/actions/otp-actions.ts", content)
    ).toEqual([]);
  });

  it("flags manual session auth without authenticateAndRateLimit", () => {
    const content = `"use server";
import { getAuthUser } from "@helvety/shared/auth-retry";
export async function readSomething() {
  const user = await getAuthUser({});
  return user;
}`;
    expect(
      verifyAuthActionGuards("apps/auth/app/actions/custom-read.ts", content)
    ).toEqual([
      "apps/auth/app/actions/custom-read.ts: uses manual session auth (getAuthUser/createServerClient) without authenticateAndRateLimit",
    ]);
  });
});

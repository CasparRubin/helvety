"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";

import { RATE_LIMITS } from "@/lib/rate-limit";

import { checkUserPasskeyStatus } from "./auth-action-helpers";

import type { ActionResponse } from "@helvety/shared/types/entities";

/**
 * Return passkey status for the currently authenticated user.
 *
 * Rate-limited as an authenticated read (`CREDENTIAL_READ`); not CSRF-protected.
 * Delegates credential lookup to `checkUserPasskeyStatus` so results match
 * OTP/callback flows.
 */
export async function getOwnPasskeyStatus(): Promise<
  ActionResponse<{ hasPasskey: boolean; count: number }>
> {
  const auth = await authenticateAndRateLimit({
    rateLimitPrefix: "auth-credentials",
    readRateLimitConfig: RATE_LIMITS.CREDENTIAL_READ,
  });
  if (!auth.ok) {
    return auth.response;
  }

  return checkUserPasskeyStatus(auth.ctx.user.id);
}

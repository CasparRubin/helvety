"use server";

import "server-only";

import { getValidDeviceTrustCookie } from "./device-trust-cookie";

import type { ActionResponse } from "@helvety/shared/types/entities";

/**
 * Returns whether this browser/device has a currently valid device-trust cookie.
 * Used by the `/auth/login` entry resolver (all Sign in links) and E2EE API guards.
 */
export async function getDeviceTrustStatus(): Promise<
  ActionResponse<{ trusted: boolean; userId: string | null }>
> {
  const payload = await getValidDeviceTrustCookie();
  if (!payload) {
    return { success: true, data: { trusted: false, userId: null } };
  }
  return { success: true, data: { trusted: true, userId: payload.userId } };
}

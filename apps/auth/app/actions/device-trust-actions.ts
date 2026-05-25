"use server";

import "server-only";

import { getValidDeviceTrustCookie } from "./device-trust-cookie";

import type { ActionResponse } from "@helvety/shared/types/entities";

/**
 * Returns whether this browser/device has a currently valid device-trust cookie.
 * This is a UX optimization only and must not be used for authorization.
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

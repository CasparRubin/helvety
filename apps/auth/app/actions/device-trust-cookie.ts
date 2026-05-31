import "server-only";

import {
  clearedDeviceTrustCookieOptions,
  DEVICE_TRUST_COOKIE_NAME,
  deviceTrustCookieOptions,
  encodeDeviceTrustCookieValue,
  getValidDeviceTrustFromCookieStore,
} from "@helvety/shared/device-trust-cookie";
import { cookies } from "next/headers";

export type { DeviceTrustPayload } from "@helvety/shared/device-trust-cookie";

/** Set device trust for the given user (fresh weekly TTL). */
export async function setDeviceTrustCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    DEVICE_TRUST_COOKIE_NAME,
    encodeDeviceTrustCookieValue(userId),
    deviceTrustCookieOptions()
  );
}

/** Clear device trust cookie for this browser/device. */
export async function clearDeviceTrustCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    DEVICE_TRUST_COOKIE_NAME,
    "",
    clearedDeviceTrustCookieOptions()
  );
}

/** Returns the verified device-trust payload, or null when missing/invalid/expired. */
export async function getValidDeviceTrustCookie() {
  const cookieStore = await cookies();
  return getValidDeviceTrustFromCookieStore(cookieStore);
}

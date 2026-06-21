import "server-only";

import {
  clearedDeviceTrustCookieOptions,
  decodeDeviceTrustCookieValue,
  DEVICE_TRUST_COOKIE_NAME,
  deviceTrustCookieOptions,
  encodeDeviceTrustCookieValue,
  getValidDeviceTrustFromCookieStore,
} from "@helvety/shared/device-trust-cookie";
import { logger } from "@helvety/shared/logger";
import { cookies } from "next/headers";

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

/**
 * Mints device trust for `userId` and verifies signing before returning success.
 *
 * Primary check: HMAC encode/decode on the payload before `Set-Cookie`. When the
 * runtime exposes the new cookie via `cookies().get()` in the same request,
 * read-back must match the minted user as well. Next.js Server Actions may queue
 * `Set-Cookie` without updating the in-request cookie store; then a successful
 * encode/decode check is enough to report mint success (the browser still receives
 * `Set-Cookie` on the action response).
 */
export async function mintAndVerifyDeviceTrustCookie(
  userId: string
): Promise<boolean> {
  try {
    const encoded = encodeDeviceTrustCookieValue(userId);
    if (decodeDeviceTrustCookieValue(encoded)?.userId !== userId) {
      return false;
    }

    await setDeviceTrustCookie(userId);

    const readBack = await getValidDeviceTrustCookie();
    if (readBack?.userId === userId) {
      return true;
    }

    if (readBack != null && readBack.userId !== userId) {
      logger.warn("Device trust read-back userId mismatch after mint.", {
        expectedUserId: userId,
        actualUserId: readBack.userId,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.warn("Device trust mint failed.", {
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

"use client";

import { useEffect } from "react";

import { touchVaultSessionInStorage } from "./key-storage";
import { getVaultLockDelayMs } from "./vault-session";

/** Options for {@link useVaultIdleLock}. */
export type UseVaultIdleLockOptions = Readonly<{
  userId: string | null;
  isUnlocked: boolean;
  vaultUnlockedAt: number | null;
  onLock: (userId: string) => void | Promise<void>;
}>;

/**
 * Client-side vault inactivity lock aligned with {@link vault-session} policy.
 * Renews IndexedDB timestamps on user activity and locks when idle/max lifetime elapses.
 */
export function useVaultIdleLock({
  userId,
  isUnlocked,
  vaultUnlockedAt,
  onLock,
}: UseVaultIdleLockOptions): void {
  useEffect(() => {
    if (!isUnlocked || !userId || vaultUnlockedAt === null) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const activeUserId = userId;
    const unlockedAt = vaultUnlockedAt;

    const scheduleIdleLock = () => {
      void touchVaultSessionInStorage(activeUserId);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const delayMs = getVaultLockDelayMs(unlockedAt);
      if (delayMs <= 0) {
        void onLock(activeUserId);
        return;
      }
      timeoutId = setTimeout(() => {
        void onLock(activeUserId);
      }, delayMs);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "focus",
    ];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, scheduleIdleLock, { passive: true });
    }

    scheduleIdleLock();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, scheduleIdleLock);
      }
    };
  }, [isUnlocked, onLock, userId, vaultUnlockedAt]);
}

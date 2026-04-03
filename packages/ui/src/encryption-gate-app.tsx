"use client";

import { getEncryptionParams } from "@helvety/shared/encryption-actions";

import { EncryptionGate } from "./encryption-gate";

import type { ReactNode } from "react";

const actions = {
  getEncryptionParams,
};

/**
 * App-level EncryptionGate for tasks, contacts, and notes (E2EE paths). Same
 * behavior as `EncryptionGate`; unlock still happens in `/auth` when needed.
 */
export function EncryptionGateApp({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  return (
    <EncryptionGate userId={userId} actions={actions}>
      {children}
    </EncryptionGate>
  );
}

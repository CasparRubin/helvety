"use client";

import { getEncryptionParams } from "@helvety/shared/encryption-actions";

import { EncryptionGate } from "./encryption-gate";

import type { ReactNode } from "react";

const actions = {
  getEncryptionParams,
};

/** App-level EncryptionGate using shared encryption actions (tasks, contacts). */
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

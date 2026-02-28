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
  userEmail,
  children,
}: {
  userId: string;
  userEmail: string;
  children: ReactNode;
}) {
  return (
    <EncryptionGate userId={userId} userEmail={userEmail} actions={actions}>
      {children}
    </EncryptionGate>
  );
}

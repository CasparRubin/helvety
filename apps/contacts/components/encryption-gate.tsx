"use client";

import { EncryptionGate as SharedEncryptionGate } from "@helvety/ui/encryption-gate";

import {
  getEncryptionParams,
  saveKeyCheckValue,
  verifyEncryptionPasskey,
} from "@/app/actions/encryption-actions";

import type { EncryptionGateActions } from "@helvety/ui/encryption-gate";
import type { ReactNode } from "react";

const actions: EncryptionGateActions = {
  getEncryptionParams,
  verifyEncryptionPasskey,
  saveKeyCheckValue,
};

/** Thin wrapper that binds app-local server actions to the shared EncryptionGate. */
interface EncryptionGateProps {
  userId: string;
  userEmail: string;
  children: ReactNode;
}

/** App-level EncryptionGate that injects server actions into the shared component. */
export function EncryptionGate({
  userId,
  userEmail,
  children,
}: EncryptionGateProps) {
  return (
    <SharedEncryptionGate
      userId={userId}
      userEmail={userEmail}
      actions={actions}
    >
      {children}
    </SharedEncryptionGate>
  );
}

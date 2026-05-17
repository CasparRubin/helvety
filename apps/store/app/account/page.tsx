import { requireAuth } from "@helvety/shared/auth-guard";

import { AccountClient } from "./account-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your profile, data export, and account deletion",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Account page for profile and settings management.
 * Requires authentication. Pre-fetches user data to avoid client waterfall.
 */
export default async function AccountPage() {
  const user = await requireAuth("/store/account");

  return (
    <AccountClient
      initialUser={{
        id: user.id,
        email: user.email ?? "",
        createdAt: user.created_at,
      }}
    />
  );
}

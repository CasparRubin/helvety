import { requireAuth } from "@helvety/shared/auth-guard";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { AccountClient } from "./account-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your profile and account settings",
};

/**
 * Account page for profile and settings management.
 * Requires authentication. Pre-fetches user data to avoid client waterfall.
 */
export default async function AccountPage() {
  const user = await requireAuth("/store/account");

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AccountClient
        initialUser={{
          id: user.id,
          email: user.email ?? "",
          createdAt: user.created_at,
        }}
      />
    </Suspense>
  );
}

import { requireAuth } from "@helvety/shared/auth-guard";
import { Skeleton } from "@helvety/ui/skeleton";
import { Suspense } from "react";

import { AccountClient } from "./account-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your profile and account settings",
};

/**
 * Loading skeleton for account page.
 */
function AccountLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/**
 * Account page for profile and settings management.
 * Requires authentication.
 */
export default async function AccountPage() {
  await requireAuth();

  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountClient />
    </Suspense>
  );
}

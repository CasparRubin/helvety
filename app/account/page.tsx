import { redirect } from "next/navigation";
import { Suspense } from "react";

import { EncryptionGate } from "@/components/encryption-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoginUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

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
 * Requires auth and encryption unlock.
 */
export default async function AccountPage() {
  // Server-side auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to centralized auth service if not authenticated
  if (!user) {
    redirect(getLoginUrl());
  }

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <Suspense fallback={<AccountLoading />}>
        <AccountClient />
      </Suspense>
    </EncryptionGate>
  );
}

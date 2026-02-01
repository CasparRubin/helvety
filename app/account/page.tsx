import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getLoginUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

import { AccountClient } from "./account-client";

export const metadata = {
  title: "Account",
  description: "Manage your account settings and subscriptions",
};

function AccountLoading() {
  return (
    <div className="container max-w-4xl py-8">
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
    <Suspense fallback={<AccountLoading />}>
      <AccountClient />
    </Suspense>
  );
}

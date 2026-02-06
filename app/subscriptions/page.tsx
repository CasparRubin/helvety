import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SubscriptionsPageClient } from "@/app/subscriptions/subscriptions-page-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoginUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Manage your active subscriptions and billing",
};

/**
 * Loading skeleton for the subscriptions page.
 */
function SubscriptionsLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/**
 * Subscriptions page: auth gate and compact subscriptions list (SubscriptionsTab).
 * Requires auth (no E2EE).
 */
export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getLoginUrl());
  }

  return (
    <Suspense fallback={<SubscriptionsLoading />}>
      <SubscriptionsPageClient />
    </Suspense>
  );
}

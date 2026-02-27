import { requireAuth } from "@helvety/shared/auth-guard";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { getUserSubscriptions } from "@/app/actions/subscription-actions";
import { SubscriptionsPageClient } from "@/app/subscriptions/subscriptions-page-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Manage your active subscriptions and billing",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Subscriptions page: auth gate and compact subscriptions list (SubscriptionsTab).
 * Server-prefetches subscriptions to eliminate the client-side data waterfall.
 */
export default async function SubscriptionsPage() {
  // Start data fetch before auth gate resolves to reduce server waterfall.
  const subscriptionsPromise = getUserSubscriptions();
  await requireAuth("/store/subscriptions");

  const initialSubscriptions = await subscriptionsPromise.then((r) =>
    r.success && r.data ? r.data : []
  );

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SubscriptionsPageClient initialSubscriptions={initialSubscriptions} />
    </Suspense>
  );
}

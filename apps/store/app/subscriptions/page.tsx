import { requireAuth } from "@helvety/shared/auth-guard";
import LoadingSpinner from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { getUserSubscriptions } from "@/app/actions/subscription-actions";
import { SubscriptionsPageClient } from "@/app/subscriptions/subscriptions-page-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Manage your active subscriptions and billing",
};

/**
 * Subscriptions page: auth gate and compact subscriptions list (SubscriptionsTab).
 * Server-prefetches subscriptions to eliminate the client-side data waterfall.
 */
export default async function SubscriptionsPage() {
  await requireAuth("/store/subscriptions");

  const initialSubscriptions = await getUserSubscriptions().then((r) =>
    r.success && r.data ? r.data : []
  );

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SubscriptionsPageClient initialSubscriptions={initialSubscriptions} />
    </Suspense>
  );
}

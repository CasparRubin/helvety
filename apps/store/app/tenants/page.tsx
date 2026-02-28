import { requireAuth } from "@helvety/shared/auth-guard";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { getSpoExplorerSubscriptions } from "@/app/actions/tenant-actions";
import { TenantsPageClient } from "@/app/tenants/tenants-page-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tenants",
  description: "Manage your licensed SharePoint tenants for SPO Explorer",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Tenants page: auth gate and tenant management or empty state.
 * Requires authentication.
 */
export default async function TenantsPage() {
  await requireAuth("/store/tenants");
  const subscriptionsResult = await getSpoExplorerSubscriptions();
  const initialSpoSubscriptions =
    subscriptionsResult.success && subscriptionsResult.data
      ? subscriptionsResult.data
      : [];
  const hasSpoSubscription = initialSpoSubscriptions.length > 0;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TenantsPageClient
        hasSpoSubscription={hasSpoSubscription}
        initialSpoSubscriptions={initialSpoSubscriptions}
      />
    </Suspense>
  );
}

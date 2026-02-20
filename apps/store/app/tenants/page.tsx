import { requireAuth } from "@helvety/shared/auth-guard";
import LoadingSpinner from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { TenantsPageClient } from "@/app/tenants/tenants-page-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tenants",
  description: "Manage your licensed SharePoint tenants for SPO Explorer",
};

/**
 * Tenants page: auth gate and tenant management or empty state.
 * Requires authentication.
 */
export default async function TenantsPage() {
  await requireAuth("/store/tenants");

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TenantsPageClient />
    </Suspense>
  );
}

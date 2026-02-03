import { redirect } from "next/navigation";
import { Suspense } from "react";

import { TenantsPageClient } from "@/app/tenants/tenants-page-client";
import { EncryptionGate } from "@/components/encryption-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoginUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Tenants",
  description: "Manage your licensed SharePoint tenants for SPO Explorer",
};

/**
 * Loading skeleton for the tenants page.
 */
function TenantsLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/**
 * Tenants page: auth gate and tenant management or empty state.
 */
export default async function TenantsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getLoginUrl());
  }

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <Suspense fallback={<TenantsLoading />}>
        <TenantsPageClient />
      </Suspense>
    </EncryptionGate>
  );
}

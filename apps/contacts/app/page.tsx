import { requireAuth } from "@helvety/shared/auth-guard";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { getContactsDashboardData } from "@/app/actions/batch-actions";
import { ContactsDashboard } from "@/components/contacts-dashboard";
import { EncryptionGate } from "@/components/encryption-gate";

/** Server component that prefetches all encrypted dashboard data for streaming. */
async function PrefetchedDashboard(): Promise<React.JSX.Element> {
  const result = await getContactsDashboardData();
  const initialData = result.success ? result.data : undefined;

  return (
    <ContactsDashboard
      initialEncryptedContacts={initialData?.contacts}
      initialEncryptedCategoryConfigs={initialData?.categoryConfigs}
      initialCategoryAssignment={initialData?.categoryAssignment}
    />
  );
}

/**
 * Main page - server component with auth protection.
 * Auth resolves first (cached, fast), then EncryptionGate renders
 * immediately while the contacts prefetch streams in via Suspense.
 */
export default async function Page(): Promise<React.JSX.Element> {
  const user = await requireAuth("/contacts");

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <Suspense fallback={<LoadingSpinner />}>
        <PrefetchedDashboard />
      </Suspense>
    </EncryptionGate>
  );
}

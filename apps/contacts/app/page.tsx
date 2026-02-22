import { requireAuth } from "@helvety/shared/auth-guard";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { getContactsDashboardData } from "@/app/actions/batch-actions";
import { ContactsDashboard } from "@/components/contacts-dashboard";

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

/** Main page - server component with auth protection. */
export default async function Page(): Promise<React.JSX.Element> {
  await requireAuth("/contacts");

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PrefetchedDashboard />
    </Suspense>
  );
}

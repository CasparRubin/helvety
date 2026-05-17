import { shouldForceHardLogout } from "@helvety/shared/auth-errors";
import { getLogoutUrl } from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { requireE2eeAppPageAuth } from "@helvety/shared/e2ee-page-auth";
import { ListLoadingState } from "@helvety/ui/list-states";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getContactsDashboardData } from "@/app/actions/batch-actions";
import { ContactsDashboard } from "@/components/contacts-dashboard";

/** Server component that prefetches encrypted contacts for first render before API-route refreshes. */
async function PrefetchedDashboard(): Promise<React.JSX.Element> {
  const result = await getContactsDashboardData();
  if (!result.success && shouldForceHardLogout(result.error)) {
    redirect(
      getLogoutUrl("/contacts", {
        global: true,
        currentOrigin: urls.home,
      })
    );
  }
  const initialData = result.success ? result.data : undefined;

  return <ContactsDashboard initialEncryptedContacts={initialData?.contacts} />;
}

/** Main page - server component with auth protection. */
export default async function Page(): Promise<React.JSX.Element> {
  await requireE2eeAppPageAuth("/contacts");

  return (
    <Suspense fallback={<ListLoadingState message="Loading contacts…" />}>
      <PrefetchedDashboard />
    </Suspense>
  );
}

import { shouldForceHardLogout } from "@helvety/shared/auth-errors";
import { requireAuth } from "@helvety/shared/auth-guard";
import { getLogoutUrl } from "@helvety/shared/auth-redirect";
import { resolveRequestOrigin } from "@helvety/shared/request-origin";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getContactsDashboardData } from "@/app/actions/batch-actions";
import { ContactsDashboard } from "@/components/contacts-dashboard";

/** Server component that prefetches all encrypted dashboard data for streaming. */
async function PrefetchedDashboard(): Promise<React.JSX.Element> {
  const result = await getContactsDashboardData();
  if (!result.success && shouldForceHardLogout(result.error)) {
    const requestOrigin = resolveRequestOrigin(await headers()) ?? undefined;
    redirect(
      getLogoutUrl("/contacts", {
        global: true,
        currentOrigin: requestOrigin,
      })
    );
  }
  const initialData = result.success ? result.data : undefined;

  return <ContactsDashboard initialEncryptedContacts={initialData?.contacts} />;
}

/** Main page - server component with auth protection. */
export default async function Page(): Promise<React.JSX.Element> {
  await requireAuth("/contacts");

  return <PrefetchedDashboard />;
}

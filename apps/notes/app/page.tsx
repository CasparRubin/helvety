import { shouldForceHardLogout } from "@helvety/shared/auth-errors";
import { getLogoutUrl } from "@helvety/shared/auth-redirect";
import { requireE2eeAppPageAuth } from "@helvety/shared/e2ee-page-auth";
import { resolveRequestOrigin } from "@helvety/shared/request-origin";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getFlatItemsDashboardData } from "@/app/actions/batch-actions";
import { FlatNotesDashboard } from "@/components/flat-notes-dashboard";

/** Server component that prefetches encrypted notes for first render before API-route refreshes. */
async function PrefetchedDashboard(): Promise<React.JSX.Element> {
  const result = await getFlatItemsDashboardData();
  if (!result.success && shouldForceHardLogout(result.error)) {
    const requestOrigin = resolveRequestOrigin(await headers()) ?? undefined;
    redirect(
      getLogoutUrl("/notes", {
        global: true,
        currentOrigin: requestOrigin,
      })
    );
  }
  const initialData = result.success ? result.data : undefined;

  return <FlatNotesDashboard initialEncryptedItems={initialData?.items} />;
}

/** Main page - server component with auth protection. */
export default async function Page(): Promise<React.JSX.Element> {
  await requireE2eeAppPageAuth("/notes");

  return <PrefetchedDashboard />;
}

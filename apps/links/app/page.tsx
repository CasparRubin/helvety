import { shouldForceHardLogout } from "@helvety/shared/auth-errors";
import { getLogoutUrl } from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { requireE2eeAppPageAuth } from "@helvety/shared/e2ee-page-auth";
import { ListLoadingState } from "@helvety/ui/list-states";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getLinksDashboardData } from "@/app/actions/batch-actions";
import { LinksDashboard } from "@/components/links-dashboard";

/**
 *
 */
async function PrefetchedDashboard(): Promise<React.JSX.Element> {
  const result = await getLinksDashboardData();
  if (!result.success && shouldForceHardLogout(result.error)) {
    redirect(
      getLogoutUrl("/links", {
        global: true,
        currentOrigin: urls.home,
      })
    );
  }
  const initialData = result.success ? result.data : undefined;

  return (
    <LinksDashboard
      initialEncryptedFolders={initialData?.folders}
      initialEncryptedLinks={initialData?.links}
    />
  );
}

/**
 *
 */
export default async function Page(): Promise<React.JSX.Element> {
  await requireE2eeAppPageAuth("/links");

  return (
    <Suspense fallback={<ListLoadingState message="Loading links…" />}>
      <PrefetchedDashboard />
    </Suspense>
  );
}

import { shouldForceHardLogout } from "@helvety/shared/auth-errors";
import { requireAuth } from "@helvety/shared/auth-guard";
import { getLogoutUrl } from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { redirect } from "next/navigation";

import { getFlatItemsDashboardData } from "@/app/actions/batch-actions";
import { FlatTasksDashboard } from "@/components/flat-tasks-dashboard";

/** Server component that prefetches all encrypted dashboard data for streaming. */
async function PrefetchedDashboard(): Promise<React.JSX.Element> {
  const result = await getFlatItemsDashboardData();
  if (!result.success && shouldForceHardLogout(result.error)) {
    redirect(getLogoutUrl(`${urls.home}/tasks`, { global: true }));
  }
  const initialData = result.success ? result.data : undefined;

  return <FlatTasksDashboard initialEncryptedItems={initialData?.items} />;
}

/** Main page - server component with auth protection. */
export default async function Page(): Promise<React.JSX.Element> {
  await requireAuth("/tasks");

  return <PrefetchedDashboard />;
}

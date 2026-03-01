import { shouldForceHardLogout } from "@helvety/shared/auth-errors";
import { requireAuth } from "@helvety/shared/auth-guard";
import { getLogoutUrl } from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getUnitsDashboardData } from "@/app/actions/batch-actions";
import { TaskDashboard } from "@/components/task-dashboard";

/** Server component that prefetches all encrypted dashboard data for streaming. */
async function PrefetchedDashboard(): Promise<React.JSX.Element> {
  const result = await getUnitsDashboardData();
  if (!result.success && shouldForceHardLogout(result.error)) {
    redirect(getLogoutUrl(`${urls.home}/tasks`, { global: true }));
  }
  const initialData = result.success ? result.data : undefined;

  return (
    <TaskDashboard
      initialEncryptedUnits={initialData?.units}
      initialSpaceCounts={initialData?.spaceCounts}
    />
  );
}

/** Main page - server component with auth protection. */
export default async function Page(): Promise<React.JSX.Element> {
  await requireAuth("/tasks");

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PrefetchedDashboard />
    </Suspense>
  );
}

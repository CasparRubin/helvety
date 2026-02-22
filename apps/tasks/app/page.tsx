import { requireAuth } from "@helvety/shared/auth-guard";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { getUnitsDashboardData } from "@/app/actions/batch-actions";
import { TaskDashboard } from "@/components/task-dashboard";

/** Server component that prefetches all encrypted dashboard data for streaming. */
async function PrefetchedDashboard(): Promise<React.JSX.Element> {
  const result = await getUnitsDashboardData();
  const initialData = result.success ? result.data : undefined;

  return (
    <TaskDashboard
      initialEncryptedUnits={initialData?.units}
      initialSpaceCounts={initialData?.spaceCounts}
      initialEncryptedStageConfigs={initialData?.stageConfigs}
      initialStageAssignment={initialData?.stageAssignment}
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

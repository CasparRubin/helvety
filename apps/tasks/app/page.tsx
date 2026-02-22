import { requireAuth } from "@helvety/shared/auth-guard";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { getUnitsDashboardData } from "@/app/actions/batch-actions";
import { EncryptionGate } from "@/components/encryption-gate";
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

/**
 * Main page - server component with auth protection
 * Redirects to centralized auth service if not authenticated
 * Wraps content in EncryptionGate to enforce passkey setup
 */
export default async function Page(): Promise<React.JSX.Element> {
  const user = await requireAuth("/tasks");

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <Suspense fallback={<LoadingSpinner />}>
        <PrefetchedDashboard />
      </Suspense>
    </EncryptionGate>
  );
}

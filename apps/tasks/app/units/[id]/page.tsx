import { requireAuth } from "@helvety/shared/auth-guard";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { getSpacesDashboardData } from "@/app/actions/batch-actions";
import { SpacesDashboard } from "@/components/spaces-dashboard";

/** Server component that prefetches all encrypted space dashboard data. */
async function PrefetchedSpacesDashboard({
  unitId,
}: {
  unitId: string;
}): Promise<React.JSX.Element> {
  const result = await getSpacesDashboardData(unitId);
  const initialData = result.success ? result.data : undefined;

  return (
    <SpacesDashboard
      unitId={unitId}
      initialEncryptedUnit={initialData?.unit}
      initialEncryptedSpaces={initialData?.spaces}
      initialItemCounts={initialData?.itemCounts}
      initialEncryptedStageConfigs={initialData?.stageConfigs}
      initialStageAssignment={initialData?.stageAssignment}
    />
  );
}

/** Spaces page - shows all spaces within a unit. */
export default async function SpacesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id: unitId } = await params;
  await requireAuth(`/tasks/units/${unitId}`);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PrefetchedSpacesDashboard unitId={unitId} />
    </Suspense>
  );
}

import { requireAuth } from "@helvety/shared/auth-guard";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { getItemsDashboardData } from "@/app/actions/batch-actions";
import { ItemsDashboard } from "@/components/items-dashboard";

/** Server component that prefetches all encrypted item dashboard data. */
async function PrefetchedItemsDashboard({
  unitId,
  spaceId,
}: {
  unitId: string;
  spaceId: string;
}): Promise<React.JSX.Element> {
  const result = await getItemsDashboardData(unitId, spaceId);
  const initialData = result.success ? result.data : undefined;

  return (
    <ItemsDashboard
      unitId={unitId}
      spaceId={spaceId}
      initialEncryptedUnit={initialData?.unit}
      initialEncryptedSpace={initialData?.space}
      initialEncryptedItems={initialData?.items}
      initialEncryptedStageConfigs={initialData?.stageConfigs}
      initialStageAssignment={initialData?.stageAssignment}
      initialEncryptedLabelConfigs={initialData?.labelConfigs}
      initialLabelAssignment={initialData?.labelAssignment}
    />
  );
}

/** Items page - shows all items within a space. */
export default async function ItemsPage({
  params,
}: {
  params: Promise<{ id: string; spaceId: string }>;
}): Promise<React.JSX.Element> {
  const { id: unitId, spaceId } = await params;
  await requireAuth(`/tasks/units/${unitId}/spaces/${spaceId}`);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PrefetchedItemsDashboard unitId={unitId} spaceId={spaceId} />
    </Suspense>
  );
}

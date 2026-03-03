import { shouldForceHardLogout } from "@helvety/shared/auth-errors";
import { requireAuth } from "@helvety/shared/auth-guard";
import { getLogoutUrl } from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { redirect } from "next/navigation";

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
  if (!result.success && shouldForceHardLogout(result.error)) {
    redirect(
      getLogoutUrl(`${urls.home}/tasks/units/${unitId}/spaces/${spaceId}`, {
        global: true,
      })
    );
  }
  const initialData = result.success ? result.data : undefined;

  return (
    <ItemsDashboard
      unitId={unitId}
      spaceId={spaceId}
      initialEncryptedUnit={initialData?.unit}
      initialEncryptedSpace={initialData?.space}
      initialEncryptedItems={initialData?.items}
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

  return <PrefetchedItemsDashboard unitId={unitId} spaceId={spaceId} />;
}

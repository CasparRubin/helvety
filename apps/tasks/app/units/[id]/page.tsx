import { shouldForceHardLogout } from "@helvety/shared/auth-errors";
import { requireAuth } from "@helvety/shared/auth-guard";
import { getLogoutUrl } from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { redirect } from "next/navigation";

import { getSpacesDashboardData } from "@/app/actions/batch-actions";
import { SpacesDashboard } from "@/components/spaces-dashboard";

/** Server component that prefetches all encrypted space dashboard data. */
async function PrefetchedSpacesDashboard({
  unitId,
}: {
  unitId: string;
}): Promise<React.JSX.Element> {
  const result = await getSpacesDashboardData(unitId);
  if (!result.success && shouldForceHardLogout(result.error)) {
    redirect(
      getLogoutUrl(`${urls.home}/tasks/units/${unitId}`, { global: true })
    );
  }
  const initialData = result.success ? result.data : undefined;

  return (
    <SpacesDashboard
      unitId={unitId}
      initialEncryptedUnit={initialData?.unit}
      initialEncryptedSpaces={initialData?.spaces}
      initialItemCounts={initialData?.itemCounts}
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

  return <PrefetchedSpacesDashboard unitId={unitId} />;
}

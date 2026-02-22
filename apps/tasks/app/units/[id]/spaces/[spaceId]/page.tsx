import { requireAuth } from "@helvety/shared/auth-guard";

import { ItemsDashboard } from "@/components/items-dashboard";

/** Items page - shows all items within a space. */
export default async function ItemsPage({
  params,
}: {
  params: Promise<{ id: string; spaceId: string }>;
}): Promise<React.JSX.Element> {
  const { id: unitId, spaceId } = await params;
  await requireAuth(`/tasks/units/${unitId}/spaces/${spaceId}`);

  return <ItemsDashboard unitId={unitId} spaceId={spaceId} />;
}

import { requireAuth } from "@helvety/shared/auth-guard";

import { SpacesDashboard } from "@/components/spaces-dashboard";

/** Spaces page - shows all spaces within a unit. */
export default async function SpacesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id: unitId } = await params;
  await requireAuth(`/tasks/units/${unitId}`);

  return <SpacesDashboard unitId={unitId} />;
}

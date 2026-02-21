import { requireAuth } from "@helvety/shared/auth-guard";

import { EncryptionGate } from "@/components/encryption-gate";
import { SpacesDashboard } from "@/components/spaces-dashboard";

/**
 * Spaces page - shows all spaces within a unit
 * Drill-down from the main units list
 */
export default async function SpacesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const [{ id: unitId }, user] = await Promise.all([
    params,
    requireAuth("/tasks"),
  ]);

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <SpacesDashboard unitId={unitId} />
    </EncryptionGate>
  );
}

import { requireAuth } from "@helvety/shared/auth-guard";

import { EncryptionGate } from "@/components/encryption-gate";
import { ItemsDashboard } from "@/components/items-dashboard";

/**
 * Items page - shows all items within a space
 * Drill-down from the spaces list
 */
export default async function ItemsPage({
  params,
}: {
  params: Promise<{ id: string; spaceId: string }>;
}): Promise<React.JSX.Element> {
  const [{ id: unitId, spaceId }, user] = await Promise.all([
    params,
    requireAuth("/tasks"),
  ]);

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <ItemsDashboard unitId={unitId} spaceId={spaceId} />
    </EncryptionGate>
  );
}

import { requireAuth } from "@helvety/shared/auth-guard";
import { getCSRFToken } from "@helvety/shared/csrf";
import { CSRFProvider } from "@helvety/ui/csrf-provider";

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
  const { id: unitId, spaceId } = await params;
  const [user, csrfToken] = await Promise.all([
    requireAuth(`/tasks/units/${unitId}/spaces/${spaceId}`),
    getCSRFToken().then((t) => t ?? ""),
  ]);

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider csrfToken={csrfToken}>
        <ItemsDashboard unitId={unitId} spaceId={spaceId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}

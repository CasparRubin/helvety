import { requireAuth } from "@helvety/shared/auth-guard";
import { getCSRFToken } from "@helvety/shared/csrf";

import { EncryptionGate } from "@/components/encryption-gate";
import { ItemsDashboard } from "@/components/items-dashboard";
import { CSRFProvider } from "@/lib/csrf-client";

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

  // Server-side auth check (includes retry for transient network failures)
  const user = await requireAuth();
  const csrfToken = (await getCSRFToken()) ?? "";

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider csrfToken={csrfToken}>
        <ItemsDashboard unitId={unitId} spaceId={spaceId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}

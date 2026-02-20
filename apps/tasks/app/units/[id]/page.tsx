import { requireAuth } from "@helvety/shared/auth-guard";
import { getCSRFToken } from "@helvety/shared/csrf";
import { CSRFProvider } from "@helvety/ui/csrf-provider";

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
  const { id: unitId } = await params;
  const [user, csrfToken] = await Promise.all([
    requireAuth(`/tasks/units/${unitId}`),
    getCSRFToken().then((t) => t ?? ""),
  ]);

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider csrfToken={csrfToken}>
        <SpacesDashboard unitId={unitId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}

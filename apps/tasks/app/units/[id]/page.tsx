import { requireAuth } from "@helvety/shared/auth-guard";
import { getCachedCSRFToken } from "@helvety/shared/cached-server";
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
  const [{ id: unitId }, user, csrfToken] = await Promise.all([
    params,
    requireAuth("/tasks"),
    getCachedCSRFToken().then((t) => t ?? ""),
  ]);

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider csrfToken={csrfToken}>
        <SpacesDashboard unitId={unitId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}

import { requireAuth } from "@helvety/shared/auth-guard";
import { getCSRFToken } from "@helvety/shared/csrf";

import { EncryptionGate } from "@/components/encryption-gate";
import { SpacesDashboard } from "@/components/spaces-dashboard";
import { CSRFProvider } from "@/lib/csrf-client";

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

  // Server-side auth check (includes retry for transient network failures)
  const user = await requireAuth();
  const csrfToken = (await getCSRFToken()) ?? "";

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider csrfToken={csrfToken}>
        <SpacesDashboard unitId={unitId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}

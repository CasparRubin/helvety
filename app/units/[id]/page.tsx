import { EncryptionGate } from "@/components/encryption-gate";
import { SpacesDashboard } from "@/components/spaces-dashboard";
import { requireAuth } from "@/lib/auth-guard";
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

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider>
        <SpacesDashboard unitId={unitId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}

import { redirect } from "next/navigation";

import { EncryptionGate } from "@/components/encryption-gate";
import { SpacesDashboard } from "@/components/spaces-dashboard";
import { getLoginUrl } from "@/lib/auth-redirect";
import { CSRFProvider } from "@/lib/csrf-client";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

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

  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getLoginUrl());
  }

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider>
        <SpacesDashboard unitId={unitId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}

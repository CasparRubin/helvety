import { redirect } from "next/navigation";

import { EncryptionGate } from "@/components/encryption-gate";
import { ItemsDashboard } from "@/components/items-dashboard";
import { getLoginUrl } from "@/lib/auth-redirect";
import { CSRFProvider } from "@/lib/csrf-client";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

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
        <ItemsDashboard unitId={unitId} spaceId={spaceId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}

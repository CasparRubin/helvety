import { redirect } from "next/navigation";

import { EncryptionGate } from "@/components/encryption-gate";
import { ItemEditor } from "@/components/item-editor";
import { getLoginUrl } from "@/lib/auth-redirect";
import { CSRFProvider } from "@/lib/csrf-client";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

/**
 * Item Editor page - edit an individual item's title and description
 * Uses a WYSIWYG rich text editor for the description
 */
export default async function ItemEditorPage({
  params,
}: {
  params: Promise<{ id: string; spaceId: string; itemId: string }>;
}): Promise<React.JSX.Element> {
  const { id: unitId, spaceId, itemId } = await params;

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
        <ItemEditor unitId={unitId} spaceId={spaceId} itemId={itemId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}

import { EncryptionGate } from "@/components/encryption-gate";
import { ItemEditor } from "@/components/item-editor";
import { requireAuth } from "@/lib/auth-guard";
import { CSRFProvider } from "@/lib/csrf-client";

/**
 * Item Editor page - edit an individual item's title, description, start/end
 * dates, and properties.
 * Uses a WYSIWYG rich text editor for the description and an action panel for
 * dates, stage, label, and priority selection.
 */
export default async function ItemEditorPage({
  params,
}: {
  params: Promise<{ id: string; spaceId: string; itemId: string }>;
}): Promise<React.JSX.Element> {
  const { id: unitId, spaceId, itemId } = await params;

  // Server-side auth check (includes retry for transient network failures)
  const user = await requireAuth();

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider>
        <ItemEditor unitId={unitId} spaceId={spaceId} itemId={itemId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}

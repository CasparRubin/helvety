import { requireAuth } from "@helvety/shared/auth-guard";

import { EncryptionGate } from "@/components/encryption-gate";
import { ItemEditor } from "@/components/item-editor";

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
  const [{ id: unitId, spaceId, itemId }, user] = await Promise.all([
    params,
    requireAuth("/tasks"),
  ]);

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <ItemEditor unitId={unitId} spaceId={spaceId} itemId={itemId} />
    </EncryptionGate>
  );
}

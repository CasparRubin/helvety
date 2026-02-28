import { requireAuth } from "@helvety/shared/auth-guard";

import { getItemEditorData } from "@/app/actions/batch-actions";
import { ItemEditor } from "@/components/item-editor";

/** Item Editor page - edit an individual item with a rich text editor and action panel. */
export default async function ItemEditorPage({
  params,
}: {
  params: Promise<{ id: string; spaceId: string; itemId: string }>;
}): Promise<React.JSX.Element> {
  const { id: unitId, spaceId, itemId } = await params;
  await requireAuth(`/tasks/units/${unitId}/spaces/${spaceId}/items/${itemId}`);
  const batchResult = await getItemEditorData(unitId, spaceId, itemId);

  return (
    <ItemEditor
      unitId={unitId}
      spaceId={spaceId}
      itemId={itemId}
      initialEncryptedUnit={
        batchResult.success ? batchResult.data.unit : undefined
      }
      initialEncryptedSpace={
        batchResult.success ? batchResult.data.space : undefined
      }
      initialEncryptedItem={
        batchResult.success ? batchResult.data.item : undefined
      }
    />
  );
}

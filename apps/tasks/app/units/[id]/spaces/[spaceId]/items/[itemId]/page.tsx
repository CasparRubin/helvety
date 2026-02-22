import { requireAuth } from "@helvety/shared/auth-guard";

import { ItemEditor } from "@/components/item-editor";

/** Item Editor page - edit an individual item with a rich text editor and action panel. */
export default async function ItemEditorPage({
  params,
}: {
  params: Promise<{ id: string; spaceId: string; itemId: string }>;
}): Promise<React.JSX.Element> {
  const { id: unitId, spaceId, itemId } = await params;
  await requireAuth(`/tasks/units/${unitId}/spaces/${spaceId}/items/${itemId}`);

  return <ItemEditor unitId={unitId} spaceId={spaceId} itemId={itemId} />;
}

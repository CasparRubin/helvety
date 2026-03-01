import { shouldForceHardLogout } from "@helvety/shared/auth-errors";
import { requireAuth } from "@helvety/shared/auth-guard";
import { getLogoutUrl } from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ItemEditorData unitId={unitId} spaceId={spaceId} itemId={itemId} />
    </Suspense>
  );
}

/** Loads and renders the item editor with server-fetched encrypted entities. */
async function ItemEditorData({
  unitId,
  spaceId,
  itemId,
}: {
  unitId: string;
  spaceId: string;
  itemId: string;
}): Promise<React.JSX.Element> {
  const batchResult = await getItemEditorData(unitId, spaceId, itemId);
  if (!batchResult.success && shouldForceHardLogout(batchResult.error)) {
    redirect(
      getLogoutUrl(
        `${urls.home}/tasks/units/${unitId}/spaces/${spaceId}/items/${itemId}`,
        { global: true }
      )
    );
  }

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

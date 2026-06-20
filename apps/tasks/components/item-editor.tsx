"use client";

import {
  E2eeRichTextItemEditorShell,
  useE2eeRichTextItemEditorSave,
} from "@helvety/ui/e2ee-item-editor-shell";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ItemActionPanel } from "@/components/item-action-panel";
import { ItemCommandBar } from "@/components/item-command-bar";
import { useLabels } from "@/hooks/use-labels";
import { useStages } from "@/hooks/use-stages";
import { DEFAULT_LABEL_CONFIG } from "@/lib/config/default-labels";
import { DEFAULT_STAGE_CONFIGS } from "@/lib/config/default-stages";

import type { Item, ItemInput } from "@/lib/types";

const ContactLinksPanel = dynamic(
  () =>
    import("@/components/contact-links-panel").then((m) => m.ContactLinksPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-4">
        <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
      </div>
    ),
  }
);

const NoteLinksPanel = dynamic(
  () => import("@/components/note-links-panel").then((m) => m.NoteLinksPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-4">
        <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
      </div>
    ),
  }
);

const LinkEntityLinksPanel = dynamic(
  () =>
    import("@/components/link-entity-links-panel").then(
      (m) => m.LinkEntityLinksPanel
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-4">
        <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
      </div>
    ),
  }
);

const APP_HOME_PATH = "/tasks";

/** Task editor for title, description, dates, and metadata inside the detail sheet. */
export function ItemEditor({
  itemId,
  item,
  isLoading,
  error,
  onUpdate,
  onRemove,
  onRefresh,
  onClose,
}: {
  itemId: string;
  item: Item | null;
  isLoading?: boolean;
  error?: string | null;
  onUpdate: (input: Partial<ItemInput>) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  onRefresh: () => Promise<void>;
  onClose?: () => void;
}) {
  const router = useRouter();
  const { stages, isLoading: isLoadingStages } = useStages(
    DEFAULT_STAGE_CONFIGS.item.id
  );
  const [isSavingStage, setIsSavingStage] = useState(false);

  const { labels, isLoading: isLoadingLabels } = useLabels(
    DEFAULT_LABEL_CONFIG.id
  );
  const [isSavingLabel, setIsSavingLabel] = useState(false);

  const [isSavingPriority, setIsSavingPriority] = useState(false);
  const [isSavingDates, setIsSavingDates] = useState(false);

  const [title, setTitle] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onSave = useE2eeRichTextItemEditorSave({ update: onUpdate });

  useEffect(() => {
    if (item && !hasInitialized) {
      setTitle(item.title);
      setHasInitialized(true);
    }
  }, [item, hasInitialized]);

  const doBack = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    router.replace(APP_HOME_PATH);
  }, [onClose, router]);

  const handleEditorRefresh = useCallback(async () => {
    setHasInitialized(false);
    await onRefresh();
  }, [onRefresh]);

  const handleDeleteItem = useCallback(async () => {
    setIsDeleting(true);
    try {
      const success = await onRemove();
      if (success) {
        if (onClose) {
          onClose();
        } else {
          router.replace(APP_HOME_PATH);
        }
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  }, [onClose, onRemove, router]);

  const handleStageChange = useCallback(
    async (stageId: string) => {
      if (!item) return;
      if (item.stage_id === stageId) return;
      setIsSavingStage(true);
      try {
        await onUpdate({ stage_id: stageId });
      } finally {
        setIsSavingStage(false);
      }
    },
    [item, onUpdate]
  );

  const handleLabelChange = useCallback(
    async (labelId: string) => {
      setIsSavingLabel(true);
      try {
        await onUpdate({ label_id: labelId });
      } finally {
        setIsSavingLabel(false);
      }
    },
    [onUpdate]
  );

  const handlePriorityChange = useCallback(
    async (priority: number) => {
      setIsSavingPriority(true);
      try {
        await onUpdate({ priority });
      } finally {
        setIsSavingPriority(false);
      }
    },
    [onUpdate]
  );

  const handleStartDateChange = useCallback(
    async (startDate: string | null) => {
      setIsSavingDates(true);
      try {
        await onUpdate({ start_date: startDate });
      } finally {
        setIsSavingDates(false);
      }
    },
    [onUpdate]
  );

  const handleEndDateChange = useCallback(
    async (endDate: string | null) => {
      setIsSavingDates(true);
      try {
        await onUpdate({ end_date: endDate });
      } finally {
        setIsSavingDates(false);
      }
    },
    [onUpdate]
  );

  if (!item && !error && isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  return (
    <E2eeRichTextItemEditorShell
      editorSessionKey={itemId}
      title={title}
      initialDescription={item?.description ?? null}
      isLoading={Boolean(isLoading)}
      hasItem={Boolean(item)}
      error={error ?? null}
      hasInitialized={hasInitialized}
      onTitleChange={setTitle}
      onSave={onSave}
      onRefresh={handleEditorRefresh}
      onBack={doBack}
      titlePlaceholder="Task title..."
      notFoundMessage="Task not found"
      loadErrorMessage="Couldn't load this task. Please try again."
      onDeleteRequested={() => setIsDeleteOpen(true)}
      renderCommandBar={(props) => (
        <ItemCommandBar
          onBack={props.onBack}
          showBack={props.showBack}
          onRefresh={props.onRefresh}
          isRefreshing={props.isRefreshing}
          onSave={props.onSave}
          isSaving={props.isSaving}
          hasUnsavedChanges={props.hasUnsavedChanges}
          saveStatus={props.saveStatus}
          onDelete={props.onDelete}
          deleteLabel="Delete Task"
        />
      )}
      renderMetadata={
        item ? (
          <ItemActionPanel
            item={item}
            stages={stages}
            isLoadingStages={isLoadingStages}
            onStageChange={handleStageChange}
            isSavingStage={isSavingStage}
            labels={labels}
            isLoadingLabels={isLoadingLabels}
            onLabelChange={handleLabelChange}
            isSavingLabel={isSavingLabel}
            onPriorityChange={handlePriorityChange}
            isSavingPriority={isSavingPriority}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            isSavingDates={isSavingDates}
            stacked
          />
        ) : null
      }
      renderLinks={
        <>
          <ContactLinksPanel itemId={itemId} />
          <NoteLinksPanel itemId={itemId} />
          <LinkEntityLinksPanel itemId={itemId} />
        </>
      }
      deleteDialog={
        item ? (
          <DeleteConfirmationDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            entityType="item"
            entityName={item.title}
            onConfirm={handleDeleteItem}
            isDeleting={isDeleting}
          />
        ) : null
      }
    />
  );
}

"use client";

import { emptyTaskInput } from "@helvety/shared/e2ee-create-inputs";
import { E2eeRichTextItemEditorShell } from "@helvety/ui/e2ee-item-editor-shell";
import {
  serializeRichTextContent,
  type JSONContent,
} from "@helvety/ui/tiptap-utils";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useMemo } from "react";

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

const EMPTY_TASK_CREATE_DEFAULTS = emptyTaskInput();

/** Shared props for task editor create and edit modes. */
type ItemEditorBaseProps = {
  onClose?: () => void;
};

/** Save-first create mode: inserts on first save via dashboard list hook. */
type ItemEditorCreateProps = ItemEditorBaseProps & {
  formMode: "create";
  onCreate: (input: ItemInput) => Promise<{ id: string } | null>;
  onCreated: (id: string) => void;
};

/** Edit mode: dashboard supplies the resolved task and list-hook CRUD callbacks. */
type ItemEditorEditProps = ItemEditorBaseProps & {
  formMode: "edit";
  itemId: string;
  item: Item | null;
  isLoading?: boolean;
  error?: string | null;
  onUpdate: (input: Partial<ItemInput>) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  onRefresh: () => Promise<void>;
};

/** Props for ItemEditor */
export type ItemEditorProps = ItemEditorCreateProps | ItemEditorEditProps;

/** Task editor for title, description, dates, and metadata inside the detail sheet. */
export function ItemEditor(props: ItemEditorProps) {
  const { formMode, onClose } = props;
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

  const [title, setTitle] = useState(() =>
    formMode === "create"
      ? EMPTY_TASK_CREATE_DEFAULTS.title
      : props.formMode === "edit"
        ? (props.item?.title ?? "")
        : ""
  );
  const [stageId, setStageId] = useState<string | null>(() =>
    formMode === "create"
      ? (EMPTY_TASK_CREATE_DEFAULTS.stage_id ?? null)
      : props.formMode === "edit"
        ? (props.item?.stage_id ?? null)
        : null
  );
  const [labelId, setLabelId] = useState<string | null>(() =>
    formMode === "create"
      ? (EMPTY_TASK_CREATE_DEFAULTS.label_id ?? null)
      : props.formMode === "edit"
        ? (props.item?.label_id ?? null)
        : null
  );
  const [priority, setPriority] = useState(() =>
    formMode === "create"
      ? (EMPTY_TASK_CREATE_DEFAULTS.priority ?? 1)
      : props.formMode === "edit"
        ? (props.item?.priority ?? 1)
        : 1
  );
  const [startDate, setStartDate] = useState<string | null>(() =>
    formMode === "create"
      ? (EMPTY_TASK_CREATE_DEFAULTS.start_date ?? null)
      : props.formMode === "edit"
        ? (props.item?.start_date ?? null)
        : null
  );
  const [endDate, setEndDate] = useState<string | null>(() =>
    formMode === "create"
      ? (EMPTY_TASK_CREATE_DEFAULTS.end_date ?? null)
      : props.formMode === "edit"
        ? (props.item?.end_date ?? null)
        : null
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(
    () =>
      formMode === "create" || (props.formMode === "edit" && props.item != null)
  );

  const item = formMode === "edit" ? props.item : null;
  const itemId = formMode === "edit" ? props.itemId : "create";
  const isLoading = formMode === "edit" ? props.isLoading : false;
  const error = formMode === "edit" ? props.error : null;

  useEffect(() => {
    if (formMode === "edit" && item && !hasInitialized) {
      setTitle(item.title);
      setStageId(item.stage_id);
      setLabelId(item.label_id);
      setPriority(item.priority);
      setStartDate(item.start_date);
      setEndDate(item.end_date);
      setHasInitialized(true);
    }
  }, [formMode, item, hasInitialized]);

  const hasAdditionalUnsavedChanges = useMemo(() => {
    if (formMode !== "create") return false;
    return (
      stageId !== (EMPTY_TASK_CREATE_DEFAULTS.stage_id ?? null) ||
      labelId !== (EMPTY_TASK_CREATE_DEFAULTS.label_id ?? null) ||
      priority !== (EMPTY_TASK_CREATE_DEFAULTS.priority ?? 1) ||
      startDate !== (EMPTY_TASK_CREATE_DEFAULTS.start_date ?? null) ||
      endDate !== (EMPTY_TASK_CREATE_DEFAULTS.end_date ?? null)
    );
  }, [endDate, formMode, labelId, priority, stageId, startDate]);

  const onSave = useCallback(
    async (newTitle: string, newDescription: JSONContent | null) => {
      const description = newDescription
        ? serializeRichTextContent(newDescription)
        : null;

      if (formMode === "create") {
        const created = await props.onCreate({
          title: newTitle,
          description,
          start_date: startDate,
          end_date: endDate,
          stage_id: stageId,
          label_id: labelId,
          priority,
        });
        if (created) {
          props.onCreated(created.id);
        }
        return Boolean(created);
      }

      return props.onUpdate({
        title: newTitle,
        description,
      });
    },
    [endDate, formMode, labelId, priority, props, stageId, startDate]
  );

  const doBack = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    router.replace(APP_HOME_PATH);
  }, [onClose, router]);

  const handleEditorRefresh = useCallback(async () => {
    if (formMode !== "edit") {
      return;
    }
    setHasInitialized(false);
    await props.onRefresh();
  }, [formMode, props]);

  const handleDeleteItem = useCallback(async () => {
    if (formMode !== "edit") {
      return;
    }
    setIsDeleting(true);
    try {
      const success = await props.onRemove();
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
  }, [formMode, onClose, props, router]);

  const handleStageChange = useCallback(
    async (stageId: string) => {
      if (formMode === "create") {
        setStageId(stageId);
        return;
      }
      if (!item) return;
      if (item.stage_id === stageId) return;
      setIsSavingStage(true);
      try {
        await props.onUpdate({ stage_id: stageId });
      } finally {
        setIsSavingStage(false);
      }
    },
    [formMode, item, props]
  );

  const handleLabelChange = useCallback(
    async (labelId: string) => {
      if (formMode === "create") {
        setLabelId(labelId);
        return;
      }
      setIsSavingLabel(true);
      try {
        await props.onUpdate({ label_id: labelId });
      } finally {
        setIsSavingLabel(false);
      }
    },
    [formMode, props]
  );

  const handlePriorityChange = useCallback(
    async (priority: number) => {
      if (formMode === "create") {
        setPriority(priority);
        return;
      }
      setIsSavingPriority(true);
      try {
        await props.onUpdate({ priority });
      } finally {
        setIsSavingPriority(false);
      }
    },
    [formMode, props]
  );

  const handleStartDateChange = useCallback(
    async (startDate: string | null) => {
      if (formMode === "create") {
        setStartDate(startDate);
        return;
      }
      setIsSavingDates(true);
      try {
        await props.onUpdate({ start_date: startDate });
      } finally {
        setIsSavingDates(false);
      }
    },
    [formMode, props]
  );

  const handleEndDateChange = useCallback(
    async (endDate: string | null) => {
      if (formMode === "create") {
        setEndDate(endDate);
        return;
      }
      setIsSavingDates(true);
      try {
        await props.onUpdate({ end_date: endDate });
      } finally {
        setIsSavingDates(false);
      }
    },
    [formMode, props]
  );

  const metadataItem: Item | null =
    formMode === "edit"
      ? item
      : hasInitialized
        ? ({
            id: "create",
            user_id: "",
            title,
            description: null,
            start_date: startDate,
            end_date: endDate,
            stage_id: stageId,
            label_id: labelId,
            priority,
            sort_order: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } satisfies Item)
        : null;

  if (formMode === "edit" && !item && !error && isLoading) {
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
      hasItem={formMode === "create" ? hasInitialized : Boolean(item)}
      error={error ?? null}
      hasInitialized={hasInitialized}
      onTitleChange={setTitle}
      onSave={onSave}
      onRefresh={handleEditorRefresh}
      onBack={doBack}
      titlePlaceholder="Task title..."
      notFoundMessage="Task not found"
      loadErrorMessage="Couldn't load this task. Please try again."
      hasAdditionalUnsavedChanges={hasAdditionalUnsavedChanges}
      onDeleteRequested={
        formMode === "edit" ? () => setIsDeleteOpen(true) : undefined
      }
      renderCommandBar={(props) => (
        <ItemCommandBar
          onBack={props.onBack}
          showBack={props.showBack}
          onRefresh={formMode === "edit" ? props.onRefresh : undefined}
          isRefreshing={props.isRefreshing}
          onSave={props.onSave}
          isSaving={props.isSaving}
          hasUnsavedChanges={props.hasUnsavedChanges}
          saveStatus={props.saveStatus}
          onDelete={formMode === "edit" ? props.onDelete : undefined}
          deleteLabel="Delete Task"
        />
      )}
      renderMetadata={
        metadataItem ? (
          <ItemActionPanel
            item={metadataItem}
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
        formMode === "edit" ? (
          <>
            <ContactLinksPanel itemId={itemId} />
            <NoteLinksPanel itemId={itemId} />
            <LinkEntityLinksPanel itemId={itemId} />
          </>
        ) : null
      }
      deleteDialog={
        formMode === "edit" && item ? (
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

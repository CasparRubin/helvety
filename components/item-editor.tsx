"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";

import { AttachmentPanel } from "@/components/attachment-panel";
import { ContactLinksPanel } from "@/components/contact-links-panel";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ItemActionPanel } from "@/components/item-action-panel";
import { ItemCommandBar } from "@/components/item-command-bar";
import { LabelConfiguratorContent } from "@/components/label-configurator";
import { SettingsPanel } from "@/components/settings-panel";
import { StageConfiguratorContent } from "@/components/stage-configurator";
import {
  TiptapEditor,
  parseDescriptionContent,
  serializeDescriptionContent,
} from "@/components/tiptap-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  useUnit,
  useSpace,
  useItem,
  useStageConfigs,
  useStageAssignment,
  useStages,
  useLabelConfigs,
  useLabelAssignment,
  useLabels,
} from "@/hooks";

import type { TiptapEditorRef } from "@/components/tiptap-editor";
import type { JSONContent } from "@tiptap/react";

/**
 * Save status for the editor
 */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Item Editor - Full page editor for item title, description, and properties.
 * Uses a two-column responsive layout: content (left/bottom) and action panel (right/top).
 */
export function ItemEditor({
  unitId,
  spaceId,
  itemId,
}: {
  unitId: string;
  spaceId: string;
  itemId: string;
}) {
  const router = useRouter();
  const { unit, isLoading: isLoadingUnit } = useUnit(unitId);
  const { space, isLoading: isLoadingSpace } = useSpace(spaceId);
  const {
    item,
    isLoading: isLoadingItem,
    error,
    update,
    refresh,
    remove,
  } = useItem(itemId);

  // Stage data for the action panel
  const {
    effectiveConfigId,
    assign: assignStage,
    unassign: unassignStage,
  } = useStageAssignment("item", spaceId);
  const { stages, isLoading: isLoadingStages } = useStages(effectiveConfigId);
  const [isSavingStage, setIsSavingStage] = useState(false);
  const {
    configs: stageConfigs,
    create: createStageConfig,
    remove: removeStageConfig,
    update: updateStageConfig,
  } = useStageConfigs("item");

  // Label data for the action panel
  const {
    effectiveConfigId: effectiveLabelConfigId,
    assign: assignLabel,
    unassign: unassignLabel,
  } = useLabelAssignment(spaceId);
  const { labels, isLoading: isLoadingLabels } = useLabels(
    effectiveLabelConfigId
  );
  const [isSavingLabel, setIsSavingLabel] = useState(false);
  const {
    configs: labelConfigs,
    create: createLabelConfig,
    remove: removeLabelConfig,
    update: updateLabelConfig,
  } = useLabelConfigs();

  const [isSavingPriority, setIsSavingPriority] = useState(false);

  // Local state for editing
  const [title, setTitle] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const editorRef = useRef<TiptapEditorRef>(null);

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Delete item state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Settings panel state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Unsaved changes confirmation state
  const [pendingAction, setPendingAction] = useState<"back" | "refresh" | null>(
    null
  );

  // Value-comparison refs for unsaved-changes detection.
  // We track what was last saved/initialized so we can compare against current values
  // instead of relying on fragile event-flag tracking.
  const savedTitleRef = useRef("");
  const savedDescriptionRef = useRef<string | null>(null);
  // Captures the editor's normalized output on its first emission (initialization).
  // Until captured, description changes are not treated as user edits.
  const editorBaselineCaptured = useRef(false);

  // Initialize form with item data
  useEffect(() => {
    if (item && !hasInitialized) {
      setTitle(item.title);
      savedTitleRef.current = item.title;
      // Description baseline is captured via editorBaselineCaptured on first TiptapEditor emission
      setHasInitialized(true);
    }
  }, [item, hasInitialized]);

  // Save function
  const save = useCallback(
    async (newTitle: string, newDescription: JSONContent | null) => {
      setSaveStatus("saving");

      const descriptionString = newDescription
        ? serializeDescriptionContent(newDescription)
        : null;

      const success = await update({
        title: newTitle,
        description: descriptionString,
      });

      if (success) {
        // Update saved-value refs so subsequent comparisons use the just-saved values
        savedTitleRef.current = newTitle;
        if (newDescription) {
          savedDescriptionRef.current = JSON.stringify(newDescription);
        } else {
          savedDescriptionRef.current = null;
        }

        setSaveStatus("saved");
        setHasUnsavedChanges(false);
        // Reset to idle after a short delay
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    },
    [update]
  );

  // Handle title change: compare against saved value to determine dirty state
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);

      if (hasInitialized) {
        const titleChanged = newTitle !== savedTitleRef.current;
        const currentDescJson = editorRef.current?.getJSON();
        const currentDescSerialized = currentDescJson
          ? JSON.stringify(currentDescJson)
          : null;
        const descChanged =
          currentDescSerialized !== savedDescriptionRef.current;
        setHasUnsavedChanges(titleChanged || descChanged);
      }
    },
    [hasInitialized]
  );

  // Handle description change: capture editor baseline on first emission, then compare values
  const handleDescriptionChange = useCallback(
    (content: JSONContent) => {
      const serialized = JSON.stringify(content);

      // On the first emission after mount/refresh, capture the editor's normalized
      // output as the baseline. This accounts for any content normalization TiptapEditor
      // performs on the initial content (e.g., adding empty paragraphs, restructuring).
      if (!editorBaselineCaptured.current) {
        savedDescriptionRef.current = serialized;
        editorBaselineCaptured.current = true;
        return;
      }

      if (hasInitialized) {
        const descChanged = serialized !== savedDescriptionRef.current;
        const titleChanged = title !== savedTitleRef.current;
        setHasUnsavedChanges(descChanged || titleChanged);
      }
    },
    [hasInitialized, title]
  );

  // Manual save (for button in command bar)
  const handleManualSave = useCallback(async () => {
    if (!title.trim()) return;

    const currentContent = editorRef.current?.getJSON() ?? null;
    await save(title, currentContent);
  }, [title, save]);

  // Actual back navigation (no confirmation)
  const doBack = useCallback(() => {
    router.push(`/units/${unitId}/spaces/${spaceId}`);
  }, [router, unitId, spaceId]);

  // Actual refresh (no confirmation)
  const doRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Reset initialization state so form re-initializes with new data
      setHasInitialized(false);
      setHasUnsavedChanges(false);
      // Reset baseline so the next TiptapEditor emission is captured as the new baseline
      editorBaselineCaptured.current = false;
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  // Handle back navigation - confirms if unsaved changes
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction("back");
    } else {
      doBack();
    }
  }, [hasUnsavedChanges, doBack]);

  // Handle refresh - confirms if unsaved changes
  const handleRefresh = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction("refresh");
    } else {
      void doRefresh();
    }
  }, [hasUnsavedChanges, doRefresh]);

  // Handle confirming the pending action (discard unsaved changes)
  const handleConfirmDiscard = useCallback(() => {
    const action = pendingAction;
    setPendingAction(null);
    if (action === "back") {
      doBack();
    } else if (action === "refresh") {
      void doRefresh();
    }
  }, [pendingAction, doBack, doRefresh]);

  // Handle delete item
  const handleDeleteItem = useCallback(async () => {
    setIsDeleting(true);
    try {
      const success = await remove();
      if (success) {
        router.push(`/units/${unitId}/spaces/${spaceId}`);
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  }, [remove, router, unitId, spaceId]);

  // Handle stage change - saves immediately, independent of title/description save flow
  const handleStageChange = useCallback(
    async (stageId: string | null) => {
      setIsSavingStage(true);
      try {
        await update({ stage_id: stageId });
      } finally {
        setIsSavingStage(false);
      }
    },
    [update]
  );

  // Handle label change - saves immediately, independent of title/description save flow
  const handleLabelChange = useCallback(
    async (labelId: string | null) => {
      setIsSavingLabel(true);
      try {
        await update({ label_id: labelId });
      } finally {
        setIsSavingLabel(false);
      }
    },
    [update]
  );

  // Handle priority change - saves immediately, independent of title/description save flow
  const handlePriorityChange = useCallback(
    async (priority: number) => {
      setIsSavingPriority(true);
      try {
        await update({ priority });
      } finally {
        setIsSavingPriority(false);
      }
    },
    [update]
  );

  // Loading state: only show spinner on initial load, not during refresh after save
  // (refresh sets isLoading=true which would unmount TiptapEditor and cause false dirty state)
  if (isLoadingItem && !hasInitialized) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <>
        <ItemCommandBar
          onBack={handleBack}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onSettings={() => setIsSettingsOpen(true)}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-destructive">{error ?? "Item not found"}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <ItemCommandBar
        onBack={handleBack}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onSave={handleManualSave}
        isSaving={saveStatus === "saving"}
        hasUnsavedChanges={hasUnsavedChanges}
        saveStatus={saveStatus}
        onSettings={() => setIsSettingsOpen(true)}
        onDelete={() => setIsDeleteOpen(true)}
        deleteLabel="Delete Item"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb navigation */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Units</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/units/${unitId}`}>
                    {isLoadingUnit ? "..." : (unit?.title ?? "Unknown")}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/units/${unitId}/spaces/${spaceId}`}>
                    {isLoadingSpace ? "..." : (space?.title ?? "Unknown")}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{title || "Untitled"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Two-column layout: content left, action panel right (reversed on mobile so panel is on top) */}
        <div className="flex flex-col-reverse md:flex-row md:gap-8">
          {/* Left column - main content */}
          <div className="min-w-0 flex-1">
            {/* Title input */}
            <div className="mb-6">
              <input
                id="item-title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Item title..."
                className="placeholder:text-muted-foreground w-full bg-transparent py-4 text-2xl leading-tight font-bold outline-none md:text-4xl"
              />
            </div>

            {/* Description editor */}
            <div className="mb-6">
              <TiptapEditor
                ref={editorRef}
                content={parseDescriptionContent(item.description)}
                onChange={handleDescriptionChange}
                placeholder="Add a description... Use the toolbar above for formatting."
                autoFocus={false}
              />
            </div>

            {/* Attachments */}
            <div className="mb-6">
              <AttachmentPanel itemId={itemId} />
            </div>

            {/* Linked Contacts */}
            <div className="mb-6">
              <ContactLinksPanel entityType="item" entityId={itemId} />
            </div>
          </div>

          {/* Right column - action panel */}
          <div className="mb-6 md:mb-0">
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
            />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        sections={[
          {
            id: "stages",
            label: "Stages",
            content: (
              <StageConfiguratorContent
                entityType="item"
                configs={stageConfigs}
                assignedConfigId={effectiveConfigId}
                onCreateConfig={async (name) => createStageConfig({ name })}
                onDeleteConfig={removeStageConfig}
                onUpdateConfig={async (id, name) =>
                  updateStageConfig(id, { name })
                }
                onAssignConfig={assignStage}
                onUnassignConfig={unassignStage}
              />
            ),
          },
          {
            id: "labels",
            label: "Labels",
            content: (
              <LabelConfiguratorContent
                configs={labelConfigs}
                assignedConfigId={effectiveLabelConfigId}
                onCreateConfig={async (name) => createLabelConfig({ name })}
                onDeleteConfig={removeLabelConfig}
                onUpdateConfig={async (id, name) =>
                  updateLabelConfig(id, { name })
                }
                onAssignConfig={assignLabel}
                onUnassignConfig={unassignLabel}
              />
            ),
          },
        ]}
      />

      {/* Delete Item Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        entityType="item"
        entityName={item.title}
        onConfirm={handleDeleteItem}
        isDeleting={isDeleting}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost. Are you sure you want
              to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDiscard}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

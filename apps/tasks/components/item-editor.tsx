"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@helvety/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@helvety/ui/breadcrumb";
import { Button } from "@helvety/ui/button";
import {
  parseRichTextContent,
  serializeRichTextContent,
} from "@helvety/ui/tiptap-utils";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";

const TiptapEditor = dynamic(
  () => import("@helvety/ui/tiptap-editor").then((m) => m.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border-border/40 flex min-h-[200px] items-center justify-center rounded-md border">
        <Loader2Icon className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    ),
  }
);

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ItemActionPanel } from "@/components/item-action-panel";
import { ItemCommandBar } from "@/components/item-command-bar";
import { useItem } from "@/hooks/use-items";
import { useLabels } from "@/hooks/use-labels";
import { useRouteInstanceGuard } from "@/hooks/use-route-instance-guard";
import { useSpace } from "@/hooks/use-spaces";
import { useStages } from "@/hooks/use-stages";
import { useUnit } from "@/hooks/use-units";
import { DEFAULT_LABEL_CONFIG } from "@/lib/config/default-labels";
import { DEFAULT_STAGE_CONFIGS } from "@/lib/config/default-stages";

import type { ItemRow, SpaceRow, UnitRow } from "@/lib/types";
import type { TiptapEditorRef } from "@helvety/ui/tiptap-editor";
import type { JSONContent } from "@tiptap/react";

const AttachmentPanel = dynamic(
  () => import("@/components/attachment-panel").then((m) => m.AttachmentPanel),
  {
    loading: () => (
      <div className="flex items-center justify-center py-4">
        <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
      </div>
    ),
  }
);

const ContactLinksPanel = dynamic(
  () =>
    import("@/components/contact-links-panel").then((m) => m.ContactLinksPanel),
  {
    loading: () => (
      <div className="flex items-center justify-center py-4">
        <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
      </div>
    ),
  }
);

/**
 * Save status for the editor
 */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Item Editor - Full page editor for item title, description, start/end dates, and properties.
 * Uses a two-column responsive layout: content (left/bottom) and action panel (right/top).
 */
export function ItemEditor({
  unitId,
  spaceId,
  itemId,
  initialEncryptedUnit,
  initialEncryptedSpace,
  initialEncryptedItem,
}: {
  unitId: string;
  spaceId: string;
  itemId: string;
  initialEncryptedUnit?: UnitRow;
  initialEncryptedSpace?: SpaceRow;
  initialEncryptedItem?: ItemRow;
}) {
  const router = useRouter();
  const { canNavigate } = useRouteInstanceGuard();
  const { unit, isLoading: isLoadingUnit } = useUnit(unitId, {
    initialEncryptedData: initialEncryptedUnit,
  });
  const { space, isLoading: isLoadingSpace } = useSpace(spaceId, {
    initialEncryptedData: initialEncryptedSpace,
  });
  const {
    item,
    isLoading: isLoadingItem,
    error,
    update,
    refresh,
    remove,
  } = useItem(itemId, {
    initialEncryptedData: initialEncryptedItem,
  });

  // Stage data for the action panel
  const { stages, isLoading: isLoadingStages } = useStages(
    DEFAULT_STAGE_CONFIGS.item.id
  );
  const [isSavingStage, setIsSavingStage] = useState(false);

  // Label data for the action panel
  const { labels, isLoading: isLoadingLabels } = useLabels(
    DEFAULT_LABEL_CONFIG.id
  );
  const [isSavingLabel, setIsSavingLabel] = useState(false);

  const [isSavingPriority, setIsSavingPriority] = useState(false);
  const [isSavingDates, setIsSavingDates] = useState(false);

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
        ? serializeRichTextContent(newDescription)
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
    if (canNavigate()) {
      router.replace(`/units/${unitId}/spaces/${spaceId}`);
    }
  }, [router, unitId, spaceId, canNavigate]);

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
      if (success && canNavigate()) {
        router.replace(`/units/${unitId}/spaces/${spaceId}`);
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  }, [remove, router, unitId, spaceId, canNavigate]);

  // Handle stage change - saves immediately, independent of title/description save flow
  const handleStageChange = useCallback(
    async (stageId: string) => {
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
    async (labelId: string) => {
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

  // Handle start date change - saves immediately, independent of title/description save flow
  const handleStartDateChange = useCallback(
    async (startDate: string | null) => {
      setIsSavingDates(true);
      try {
        await update({ start_date: startDate });
      } finally {
        setIsSavingDates(false);
      }
    },
    [update]
  );

  // Handle end date change - saves immediately, independent of title/description save flow
  const handleEndDateChange = useCallback(
    async (endDate: string | null) => {
      setIsSavingDates(true);
      try {
        await update({ end_date: endDate });
      } finally {
        setIsSavingDates(false);
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

  // Error state - friendly UI with retry (toast already shown by hooks)
  if (error || !item) {
    return (
      <>
        <ItemCommandBar
          onBack={handleBack}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-muted/30 flex flex-col items-center justify-center gap-3 py-12">
            <p className="text-muted-foreground text-sm">
              {error ? "Something went wrong" : "Item not found"}
            </p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Retry
            </Button>
          </div>
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
        <div className="flex flex-col-reverse gap-6 md:flex-row md:gap-8">
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
                content={parseRichTextContent(item.description)}
                onChange={handleDescriptionChange}
                placeholder="Add a description... Use the toolbar above for formatting."
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
          />
        </div>
      </div>

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

"use client";

import { CheckIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";

import { ItemActionPanel } from "@/components/item-action-panel";
import { ItemCommandBar } from "@/components/item-command-bar";
import {
  TiptapEditor,
  parseDescriptionContent,
  serializeDescriptionContent,
} from "@/components/tiptap-editor";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useUnit,
  useSpace,
  useItem,
  useStageAssignment,
  useStages,
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
  } = useItem(itemId);

  // Stage data for the action panel
  const { effectiveConfigId } = useStageAssignment("item", spaceId);
  const { stages, isLoading: isLoadingStages } = useStages(effectiveConfigId);
  const [isSavingStage, setIsSavingStage] = useState(false);
  const [isSavingPriority, setIsSavingPriority] = useState(false);

  // Local state for editing
  const [title, setTitle] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const editorRef = useRef<TiptapEditorRef>(null);

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Ref to skip initial onChange events from TiptapEditor during initialization
  // TiptapEditor may fire onChange when normalizing content structure on mount
  const skipInitialDescriptionChange = useRef(true);

  // Initialize form with item data
  useEffect(() => {
    if (item && !hasInitialized) {
      setTitle(item.title);
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

  // Handle title change
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);

      if (hasInitialized) {
        setHasUnsavedChanges(true);
      }
    },
    [hasInitialized]
  );

  // Handle description change
  const handleDescriptionChange = useCallback(
    (_content: JSONContent) => {
      // Skip the first onChange which may be from TiptapEditor initialization
      // (e.g., content normalization when parsing the initial description)
      if (skipInitialDescriptionChange.current) {
        skipInitialDescriptionChange.current = false;
        return;
      }

      if (hasInitialized) {
        setHasUnsavedChanges(true);
      }
    },
    [hasInitialized]
  );

  // Manual save (for button in command bar)
  const handleManualSave = useCallback(async () => {
    if (!title.trim()) return;

    const currentContent = editorRef.current?.getJSON() ?? null;
    await save(title, currentContent);
  }, [title, save]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.push(`/units/${unitId}/spaces/${spaceId}`);
  }, [router, unitId, spaceId]);

  // Handle refresh - reloads item data from server
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Reset initialization state so form re-initializes with new data
      setHasInitialized(false);
      skipInitialDescriptionChange.current = true;
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

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

  // Loading state
  if (isLoadingItem) {
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
      />
      <div className="container mx-auto px-4 py-8">
        {/* Two-column layout: content left, action panel right (reversed on mobile so panel is on top) */}
        <div className="flex flex-col-reverse md:flex-row md:gap-8">
          {/* Left column - main content */}
          <div className="min-w-0 flex-1">
            {/* Header with breadcrumb and save status */}
            <div className="mb-6 flex items-center justify-between">
              {/* Breadcrumb */}
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

              {/* Save status indicator */}
              <div className="flex items-center gap-2">
                {saveStatus === "saving" && (
                  <Badge variant="secondary">
                    <Loader2Icon className="size-3 animate-spin" />
                    Saving...
                  </Badge>
                )}
                {saveStatus === "saved" && (
                  <Badge variant="secondary">
                    <CheckIcon className="size-3" />
                    Saved
                  </Badge>
                )}
                {saveStatus === "error" && (
                  <Badge variant="destructive">Failed to save</Badge>
                )}
                {hasUnsavedChanges && saveStatus === "idle" && (
                  <Badge
                    variant="outline"
                    className="border-amber-500/50 text-amber-600 dark:text-amber-400"
                  >
                    <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                    Unsaved changes
                  </Badge>
                )}
              </div>
            </div>

            {/* Title input */}
            <div className="mb-6">
              <Label
                htmlFor="item-title"
                className="text-muted-foreground mb-2 block text-sm font-medium"
              >
                Title
              </Label>
              <Input
                id="item-title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Item title..."
                className="border-0 bg-transparent text-2xl font-semibold shadow-none focus-visible:ring-0"
              />
            </div>

            {/* Description editor */}
            <div className="mb-6">
              <Label className="text-muted-foreground mb-2 block text-sm font-medium">
                Description
              </Label>
              <TiptapEditor
                ref={editorRef}
                content={parseDescriptionContent(item.description)}
                onChange={handleDescriptionChange}
                placeholder="Add a description... Use the toolbar above for formatting."
                autoFocus={false}
              />
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
              onPriorityChange={handlePriorityChange}
              isSavingPriority={isSavingPriority}
            />
          </div>
        </div>
      </div>
    </>
  );
}

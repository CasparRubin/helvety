"use client";

import { emptyNoteInput } from "@helvety/shared/e2ee-create-inputs";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { Card, CardContent } from "@helvety/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@helvety/ui/collapsible";
import { E2eeRichTextItemEditorShell } from "@helvety/ui/e2ee-item-editor-shell";
import { renderIcon } from "@helvety/ui/icon-renderer";
import {
  serializeRichTextContent,
  type JSONContent,
} from "@helvety/ui/tiptap-utils";
import { useIsMobile } from "@helvety/ui/use-is-mobile";
import { ChevronRightIcon, Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useMemo } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ItemCommandBar } from "@/components/item-command-bar";
import { DEFAULT_NOTE_CATEGORIES } from "@/lib/config/default-note-categories";

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

const TaskLinksPanel = dynamic(
  () => import("@/components/task-links-panel").then((m) => m.TaskLinksPanel),
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

const APP_HOME_PATH = "/notes";

/** Shared props for note editor create and edit modes. */
type ItemEditorBaseProps = {
  onClose?: () => void;
};

/** Save-first create mode: inserts on first save via dashboard list hook. */
type ItemEditorCreateProps = ItemEditorBaseProps & {
  formMode: "create";
  onCreate: (input: ItemInput) => Promise<{ id: string } | null>;
  onCreated: (id: string) => void;
};

/** Edit mode: dashboard supplies the resolved note and list-hook CRUD callbacks. */
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

/** Note editor for title and description inside the dashboard detail sheet. */
export function ItemEditor(props: ItemEditorProps) {
  const { formMode, onClose } = props;
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(
    () => emptyNoteInput().category_id ?? DEFAULT_NOTE_CATEGORIES[0]?.id ?? ""
  );
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const isMobile = useIsMobile();
  const [categoryOverride, setCategoryOverride] = useState<boolean | null>(
    null
  );
  const categoryOpen = categoryOverride ?? !isMobile;

  const item = formMode === "edit" ? props.item : null;
  const itemId = formMode === "edit" ? props.itemId : "create";
  const isLoading = formMode === "edit" ? props.isLoading : false;
  const error = formMode === "edit" ? props.error : null;

  useEffect(() => {
    if (formMode === "create" && !hasInitialized) {
      const defaults = emptyNoteInput();
      setTitle(defaults.title);
      setCategoryId(
        defaults.category_id ?? DEFAULT_NOTE_CATEGORIES[0]?.id ?? ""
      );
      setHasInitialized(true);
    }
  }, [formMode, hasInitialized]);

  useEffect(() => {
    if (formMode === "edit" && item && !hasInitialized) {
      setTitle(item.title);
      setCategoryId(item.category_id);
      setHasInitialized(true);
    }
  }, [formMode, item, hasInitialized]);

  const hasAdditionalUnsavedChanges = useMemo(() => {
    if (formMode !== "create" || !hasInitialized) return false;
    const defaults = emptyNoteInput();
    return (
      categoryId !==
      (defaults.category_id ?? DEFAULT_NOTE_CATEGORIES[0]?.id ?? "")
    );
  }, [categoryId, formMode, hasInitialized]);

  const onSave = useCallback(
    async (newTitle: string, newDescription: JSONContent | null) => {
      const description = newDescription
        ? serializeRichTextContent(newDescription)
        : null;

      if (formMode === "create") {
        const created = await props.onCreate({
          title: newTitle,
          description,
          category_id: categoryId,
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
    [categoryId, formMode, props]
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

  const handleCategoryChange = useCallback(
    async (categoryId: string) => {
      if (formMode === "create") {
        setCategoryId(categoryId);
        return;
      }
      if (!item || categoryId === item.category_id) return;
      setIsSavingCategory(true);
      try {
        await props.onUpdate({ category_id: categoryId });
        setCategoryId(categoryId);
      } finally {
        setIsSavingCategory(false);
      }
    },
    [formMode, item, props]
  );

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

  const metadataItem: Item | null =
    formMode === "edit"
      ? item
      : hasInitialized
        ? ({
            id: "create",
            user_id: "",
            title,
            description: null,
            category_id: categoryId,
            sort_order: 0,
            created_at: "",
            updated_at: "",
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
      titlePlaceholder="Note title..."
      notFoundMessage="Note not found"
      loadErrorMessage="Couldn't load this note. Please try again."
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
          deleteLabel="Delete Note"
        />
      )}
      renderMetadata={
        metadataItem ? (
          <div className="mb-6">
            <Card size="sm" className="bg-surface-panel">
              <CardContent>
                <Collapsible
                  open={categoryOpen}
                  onOpenChange={setCategoryOverride}
                >
                  <CollapsibleTrigger className="group flex w-full items-center justify-between">
                    <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                      Category
                      {isSavingCategory && (
                        <Loader2Icon className="size-3 animate-spin" />
                      )}
                    </h3>
                    <ChevronRightIcon className="text-muted-foreground size-4 transition-transform duration-200 group-data-panel-open:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 flex flex-col gap-1">
                      {DEFAULT_NOTE_CATEGORIES.map((category) => {
                        const isActive =
                          metadataItem.category_id === category.id;
                        return (
                          <Button
                            key={category.id}
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSavingCategory}
                            className={cn(
                              "h-auto justify-start gap-2 px-2.5 py-1.5",
                              isActive && "ring-ring/30 bg-muted ring-1"
                            )}
                            style={
                              isActive
                                ? { backgroundColor: `${category.color}18` }
                                : undefined
                            }
                            onClick={() => {
                              void handleCategoryChange(category.id);
                            }}
                          >
                            {renderIcon(category.icon, "size-4 shrink-0", {
                              color:
                                category.color ?? "var(--muted-foreground)",
                            })}
                            <span
                              className={cn(
                                "truncate text-sm",
                                isActive ? "font-medium" : "font-normal"
                              )}
                            >
                              {category.name}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        ) : null
      }
      renderLinks={
        formMode === "edit" ? (
          <>
            <TaskLinksPanel noteId={itemId} />
            <ContactLinksPanel itemId={itemId} />
            <LinkEntityLinksPanel noteId={itemId} />
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

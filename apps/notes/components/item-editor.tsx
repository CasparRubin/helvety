"use client";

import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { Card, CardContent } from "@helvety/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@helvety/ui/collapsible";
import {
  E2eeRichTextItemEditorShell,
  useE2eeRichTextItemEditorSave,
} from "@helvety/ui/e2ee-item-editor-shell";
import { renderIcon } from "@helvety/ui/icon-renderer";
import { useIsMobile } from "@helvety/ui/use-is-mobile";
import { ChevronRightIcon, Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ItemCommandBar } from "@/components/item-command-bar";
import { useItem } from "@/hooks/use-items";
import { DEFAULT_NOTE_CATEGORIES } from "@/lib/config/default-note-categories";

import type { Item, ItemRow } from "@/lib/types";

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

const APP_HOME_PATH = "/notes";

/** Note editor for title and description inside the dashboard detail sheet. */
export function ItemEditor({
  itemId,
  initialItem,
  initialEncryptedItem,
  onClose,
  onLocalPatch,
}: {
  itemId: string;
  initialItem?: Item;
  initialEncryptedItem?: ItemRow;
  onClose?: () => void;
  onLocalPatch?: (id: string, input: { category_id?: string }) => void;
}) {
  const router = useRouter();
  const {
    item,
    isLoading: isLoadingItem,
    error,
    update,
    refresh,
    remove,
  } = useItem(itemId, {
    initialData: initialItem,
    initialEncryptedData: initialEncryptedItem,
  });

  const [title, setTitle] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const isMobile = useIsMobile();
  const [categoryOverride, setCategoryOverride] = useState<boolean | null>(
    null
  );
  const categoryOpen = categoryOverride ?? !isMobile;

  const onSave = useE2eeRichTextItemEditorSave({ update });

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
    await refresh();
  }, [refresh]);

  const handleCategoryChange = useCallback(
    async (categoryId: string) => {
      if (!item || categoryId === item.category_id) return;
      const previousCategoryId = item.category_id;
      onLocalPatch?.(item.id, { category_id: categoryId });
      setIsSavingCategory(true);
      try {
        const success = await update({ category_id: categoryId });
        if (!success) {
          onLocalPatch?.(item.id, { category_id: previousCategoryId });
        }
      } finally {
        setIsSavingCategory(false);
      }
    },
    [item, onLocalPatch, update]
  );

  const handleDeleteItem = useCallback(async () => {
    setIsDeleting(true);
    try {
      const success = await remove();
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
  }, [onClose, remove, router]);

  if (!item && !error && isLoadingItem) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  return (
    <E2eeRichTextItemEditorShell
      title={title}
      description={item?.description ?? null}
      isLoading={isLoadingItem}
      hasItem={Boolean(item)}
      error={error}
      hasInitialized={hasInitialized}
      onTitleChange={setTitle}
      onSave={onSave}
      onRefresh={handleEditorRefresh}
      onBack={doBack}
      titlePlaceholder="Note title..."
      notFoundMessage="Note not found"
      loadErrorMessage="Couldn't load this note. Please try again."
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
          deleteLabel="Delete Note"
        />
      )}
      renderMetadata={
        item ? (
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
                    <ChevronRightIcon className="text-muted-foreground size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 flex flex-col gap-1">
                      {DEFAULT_NOTE_CATEGORIES.map((category) => {
                        const isActive = item.category_id === category.id;
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
        <>
          <TaskLinksPanel noteId={itemId} />
          <ContactLinksPanel itemId={itemId} />
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

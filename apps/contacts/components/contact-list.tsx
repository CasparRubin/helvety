"use client";

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { computeReorderUpdates } from "@helvety/shared/entity-list-reorder";
import { GENERIC_USER_ERROR } from "@helvety/shared/user-facing-errors";
import {
  ListEmptySearchState,
  ListEmptyState,
  ListErrorState,
  ListLoadingState,
} from "@helvety/ui/list-states";
import { useE2eeEntityListDndSensors } from "@helvety/ui/use-e2ee-entity-list-dnd-sensors";
import { useCallback, useMemo, useState } from "react";

import { CategoryGroup } from "@/components/category-group";
import { ContactRow } from "@/components/contact-row";

import type { DefaultCategory } from "@/lib/config/default-categories";
import type { Contact, ReorderUpdate } from "@/lib/types";

/** Props for the contact list. */
interface ContactListProps {
  /** The contacts to display */
  contacts: Contact[];
  /** Whether contacts are currently loading */
  isLoading: boolean;
  /** Whether contacts are being refreshed while stale rows stay visible */
  isRefreshing?: boolean;
  /** Error message if any */
  error: string | null;
  /** Callback to retry after error */
  onRetry?: () => void;
  /** Callback when a contact row is clicked */
  onContactClick?: (contact: Contact) => void;
  /** Callback to delete a contact */
  onContactDelete?: (id: string, name: string) => void;
  /** Callback for batch reorder (drag-and-drop) */
  onReorder?: (updates: ReorderUpdate[]) => Promise<boolean>;
  /** Shown when the list is empty because of an active client-side search. */
  emptySearchMessage?: string;
  /** Fixed categories used to group contacts in the list */
  categories: DefaultCategory[];
  /** Empty state title (shown when no categories and no contacts) */
  emptyTitle?: string;
  /** Empty state description (shown when no categories and no contacts) */
  emptyDescription?: string;
}

/**
 * ContactList - Category-grouped list component for contacts.
 *
 * Features:
 * - Always shows category groups when categories are available (even with no contacts)
 * - Flat list mode when no categories are configured
 * - Drag-and-drop reordering within and between categories (desktop)
 * - Up/down arrows to move contacts between categories on all screen sizes
 */
export function ContactList({
  contacts,
  isLoading,
  error,
  onRetry,
  onContactClick,
  onContactDelete,
  onReorder,
  emptySearchMessage,
  categories,
  emptyTitle = "No contacts yet",
  emptyDescription = "Create your first contact to get started.",
}: ContactListProps) {
  const hasCategories = categories.length > 0;
  const sortableDisabled = onReorder == null;

  const sensors = useE2eeEntityListDndSensors();

  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(
    null
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setHoveredCategoryId(null);
        return;
      }

      if (over.data?.current?.type === "category") {
        setHoveredCategoryId(over.data.current.categoryId ?? null);
        return;
      }

      const overContact = contacts.find((contact) => contact.id === over.id);
      if (overContact) {
        setHoveredCategoryId(overContact.category_id);
      }
    },
    [contacts]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setHoveredCategoryId(null);
      const { active, over } = event;
      if (!over || !onReorder) return;
      if (active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const activeContact = contacts.find((c) => c.id === activeId);
      const overContact = contacts.find((c) => c.id === overId);

      if (!activeContact) return;

      let targetCategoryId: string | undefined;
      if (
        over.data?.current?.type === "category" &&
        over.data.current.categoryId !== undefined
      ) {
        targetCategoryId = over.data.current.categoryId;
      }
      if (overContact?.category_id && targetCategoryId === undefined) {
        targetCategoryId = overContact.category_id;
      }

      const updates = computeReorderUpdates({
        entities: contacts,
        activeId,
        overId,
        activeEntity: activeContact,
        targetGroupId: targetCategoryId,
        groupKey: "category_id",
        droppedOnGroupContainer:
          !overContact && over.data?.current?.type === "category",
      }).map((update) => ({
        id: update.id,
        sort_order: update.sort_order,
        category_id: update.category_id ?? activeContact.category_id,
      })) satisfies ReorderUpdate[];

      if (updates.length === 0) return;

      await onReorder(updates);
    },
    [contacts, onReorder]
  );

  const handleMoveUp = useCallback(
    (contactId: string) => {
      if (!onReorder || !hasCategories) return;
      const contact = contacts.find((entity) => entity.id === contactId);
      if (!contact) return;

      const currentCategoryIdx = categories.findIndex(
        (category) => category.id === contact.category_id
      );
      if (currentCategoryIdx <= 0) return;
      const previousCategory = categories[currentCategoryIdx - 1];
      if (!previousCategory) return;

      void onReorder([
        {
          id: contact.id,
          sort_order: contact.sort_order,
          category_id: previousCategory.id,
        },
      ]);
    },
    [categories, contacts, hasCategories, onReorder]
  );

  const handleMoveDown = useCallback(
    (contactId: string) => {
      if (!onReorder || !hasCategories) return;
      const contact = contacts.find((entity) => entity.id === contactId);
      if (!contact) return;

      const currentCategoryIdx = categories.findIndex(
        (category) => category.id === contact.category_id
      );
      if (
        currentCategoryIdx < 0 ||
        currentCategoryIdx >= categories.length - 1
      ) {
        return;
      }
      const nextCategory = categories[currentCategoryIdx + 1];
      if (!nextCategory) return;

      void onReorder([
        {
          id: contact.id,
          sort_order: contact.sort_order,
          category_id: nextCategory.id,
        },
      ]);
    },
    [categories, contacts, hasCategories, onReorder]
  );

  const groupedContacts = useMemo(() => {
    if (!hasCategories) {
      return new Map<string, Contact[]>();
    }
    const sortedContacts = [...contacts].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    const groups = new Map<string, Contact[]>();
    for (const category of categories) {
      groups.set(category.id, []);
    }
    for (const contact of sortedContacts) {
      const bucket =
        groups.get(contact.category_id) ?? groups.get(categories[0]?.id ?? "");
      bucket?.push(contact);
    }
    return groups;
  }, [categories, contacts, hasCategories]);

  // Flat list branch only - skip sorting/id lists while the grouped view is active.
  const sortedContactsFlat = useMemo(() => {
    if (hasCategories) {
      return [];
    }
    return [...contacts].sort((a, b) => a.sort_order - b.sort_order);
  }, [contacts, hasCategories]);

  const contactIds = useMemo(() => {
    if (hasCategories) {
      return [];
    }
    return contacts.map((c) => c.id);
  }, [contacts, hasCategories]);

  // Loading state
  if (isLoading) {
    return <ListLoadingState />;
  }

  // Error state - friendly UI with retry (toast already shown by hooks)
  if (error) {
    return <ListErrorState message={GENERIC_USER_ERROR} onRetry={onRetry} />;
  }

  if (contacts.length === 0 && emptySearchMessage) {
    return <ListEmptySearchState message={emptySearchMessage} />;
  }

  return (
    <div className="space-y-4">
      {/* Column headers (desktop only) */}
      {contacts.length > 0 && (
        <div className="text-muted-foreground border-border hidden items-center gap-2 border-b px-3 pb-2 text-xs font-medium md:flex">
          <span className="w-4 shrink-0" /> {/* drag handle space */}
          <span className="w-4 shrink-0" /> {/* icon space */}
          <span className="flex-1">Name</span>
          <span className="w-24 shrink-0 text-right">Created</span>
          <span className="w-8 shrink-0" /> {/* actions space */}
        </div>
      )}

      {hasCategories ? (
        /* Category groups - always shown when categories exist (even with no contacts) */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div>
            {categories.map((category, categoryIndex) => {
              const categoryContacts = groupedContacts.get(category.id) ?? [];
              const isFirstCategory = categoryIndex === 0;
              const isLastCategory = categoryIndex === categories.length - 1;
              return (
                <CategoryGroup
                  key={category.id}
                  category={category}
                  contactIds={categoryContacts.map((contact) => contact.id)}
                  count={categoryContacts.length}
                  isHighlighted={hoveredCategoryId === category.id}
                >
                  {categoryContacts.map((contact) => (
                    <ContactRow
                      key={contact.id}
                      id={contact.id}
                      firstName={contact.first_name}
                      lastName={contact.last_name}
                      email={contact.email}
                      createdAt={contact.created_at}
                      categoryColor={category.color}
                      isFirst={isFirstCategory}
                      isLast={isLastCategory}
                      onClick={() => onContactClick?.(contact)}
                      onDelete={
                        onContactDelete
                          ? () =>
                              onContactDelete(
                                contact.id,
                                `${contact.first_name} ${contact.last_name}`
                              )
                          : undefined
                      }
                      onMoveUp={
                        categories.length > 1
                          ? () => handleMoveUp(contact.id)
                          : undefined
                      }
                      onMoveDown={
                        categories.length > 1
                          ? () => handleMoveDown(contact.id)
                          : undefined
                      }
                      sortableDisabled={sortableDisabled}
                    />
                  ))}
                </CategoryGroup>
              );
            })}
          </div>
        </DndContext>
      ) : contacts.length === 0 ? (
        /* Empty state - only when no categories and no contacts */
        <ListEmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        /* Flat list (no categories configured) */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="border-border divide-border overflow-hidden rounded-lg border">
            <SortableContext
              items={contactIds}
              strategy={verticalListSortingStrategy}
            >
              {sortedContactsFlat.map((contact, idx) => (
                <ContactRow
                  key={contact.id}
                  id={contact.id}
                  firstName={contact.first_name}
                  lastName={contact.last_name}
                  email={contact.email}
                  createdAt={contact.created_at}
                  isFirst={idx === 0}
                  isLast={idx === sortedContactsFlat.length - 1}
                  onClick={() => onContactClick?.(contact)}
                  onDelete={
                    onContactDelete
                      ? () =>
                          onContactDelete(
                            contact.id,
                            `${contact.first_name} ${contact.last_name}`
                          )
                      : undefined
                  }
                  sortableDisabled={sortableDisabled}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}
    </div>
  );
}

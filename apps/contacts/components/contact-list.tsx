"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Loader2Icon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { CategoryGroup, UncategorizedGroup } from "@/components/category-group";
import { ContactRow } from "@/components/contact-row";

import type { Contact, Category, ReorderUpdate } from "@/lib/types";

/** Props for the contact list. */
interface ContactListProps {
  /** The contacts to display */
  contacts: Contact[];
  /** Whether contacts are currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Available categories for the current config */
  categories: Category[];
  /** Callback when a contact row is clicked */
  onContactClick?: (contact: Contact) => void;
  /** Callback to delete a contact */
  onContactDelete?: (id: string, name: string) => void;
  /** Callback for batch reorder (drag-and-drop) */
  onReorder?: (updates: ReorderUpdate[]) => Promise<boolean>;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
}

/**
 * ContactList - List component for Contacts grouped by categories.
 */
export function ContactList({
  contacts,
  isLoading,
  error,
  categories,
  onContactClick,
  onContactDelete,
  onReorder,
  emptyTitle = "No contacts yet",
  emptyDescription = "Create your first contact to get started.",
}: ContactListProps) {
  const hasCategories = categories.length > 0;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        setHoveredCategoryId(over.data.current.categoryId ?? "uncategorized");
        return;
      }

      const overContact = contacts.find((c) => c.id === over.id);
      if (overContact) {
        setHoveredCategoryId(overContact.category_id ?? "uncategorized");
      }
    },
    [contacts]
  );

  // Build a category map for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  // Group contacts by category
  const groupedContacts = useMemo(() => {
    if (!hasCategories) return null;

    const groups = new Map<string | null, Contact[]>();

    // Initialize groups in category order
    for (const c of categories) {
      groups.set(c.id, []);
    }
    groups.set(null, []); // Uncategorized group

    for (const contact of contacts) {
      const key = contact.category_id;
      const group = groups.get(key);
      if (group) {
        group.push(contact);
      } else {
        // Contact has a category_id not in current config -> uncategorized
        const uncategorized = groups.get(null);
        if (uncategorized) uncategorized.push(contact);
      }
    }

    return groups;
  }, [contacts, categories, hasCategories]);

  // All contact IDs for SortableContext
  const contactIds = useMemo(() => contacts.map((c) => c.id), [contacts]);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setHoveredCategoryId(null);

      const { active, over } = event;
      if (!over || !onReorder) return;
      if (active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      let targetCategoryId: string | null | undefined;

      if (
        over.data?.current?.type === "category" &&
        over.data.current.categoryId !== undefined
      ) {
        targetCategoryId = over.data.current.categoryId;
      }

      const activeContact = contacts.find((c) => c.id === activeId);
      const overContact = contacts.find((c) => c.id === overId);

      if (!activeContact) return;

      if (overContact && targetCategoryId === undefined) {
        targetCategoryId = overContact.category_id;
      }

      const sortedContacts = [...contacts].sort(
        (a, b) => a.sort_order - b.sort_order
      );

      const oldIndex = sortedContacts.findIndex((c) => c.id === activeId);
      const newIndex = sortedContacts.findIndex((c) => c.id === overId);

      if (oldIndex === -1) return;

      sortedContacts.splice(oldIndex, 1);
      const insertAt = newIndex === -1 ? sortedContacts.length : newIndex;
      sortedContacts.splice(insertAt, 0, activeContact);

      const updates: ReorderUpdate[] = sortedContacts.map((c, index) => {
        const update: ReorderUpdate = {
          id: c.id,
          sort_order: index,
        };
        if (c.id === activeId && targetCategoryId !== undefined) {
          update.category_id = targetCategoryId;
        }
        return update;
      });

      await onReorder(updates);
    },
    [contacts, onReorder]
  );

  // Move up/down handlers for mobile
  const handleMoveUp = useCallback(
    (contactId: string) => {
      if (!onReorder || categories.length === 0) return;
      const contact = contacts.find((c) => c.id === contactId);
      if (!contact) return;

      const currentCategoryIdx = categories.findIndex(
        (c) => c.id === contact.category_id
      );

      let newCategoryId: string;
      if (currentCategoryIdx === -1) {
        const lastCategory = categories[categories.length - 1];
        if (!lastCategory) return;
        newCategoryId = lastCategory.id;
      } else if (currentCategoryIdx <= 0) {
        return;
      } else {
        const prevCategory = categories[currentCategoryIdx - 1];
        if (!prevCategory) return;
        newCategoryId = prevCategory.id;
      }

      const updates: ReorderUpdate[] = [
        {
          id: contact.id,
          sort_order: contact.sort_order,
          category_id: newCategoryId,
        },
      ];
      void onReorder(updates);
    },
    [contacts, categories, onReorder]
  );

  const handleMoveDown = useCallback(
    (contactId: string) => {
      if (!onReorder || categories.length === 0) return;
      const contact = contacts.find((c) => c.id === contactId);
      if (!contact) return;

      const currentCategoryIdx = categories.findIndex(
        (c) => c.id === contact.category_id
      );

      if (
        currentCategoryIdx === -1 ||
        currentCategoryIdx >= categories.length - 1
      )
        return;

      const nextCategory = categories[currentCategoryIdx + 1];
      if (!nextCategory) return;
      const newCategoryId = nextCategory.id;

      const updates: ReorderUpdate[] = [
        {
          id: contact.id,
          sort_order: contact.sort_order,
          category_id: newCategoryId,
        },
      ];
      void onReorder(updates);
    },
    [contacts, categories, onReorder]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-12 text-center">
        <p role="alert" className="text-destructive">
          {error}
        </p>
      </div>
    );
  }

  const sortedContacts = [...contacts].sort(
    (a, b) => a.sort_order - b.sort_order
  );

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

      {/* Category groups */}
      {hasCategories ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div>
            {categories.map((category, categoryIndex) => {
              const categoryContacts = groupedContacts?.get(category.id) ?? [];
              const isFirstCategory = categoryIndex === 0;
              const isLastCategory = categoryIndex === categories.length - 1;
              return (
                <CategoryGroup
                  key={category.id}
                  category={category}
                  contactIds={categoryContacts.map((c) => c.id)}
                  count={categoryContacts.length}
                  isHighlighted={hoveredCategoryId === category.id}
                >
                  {categoryContacts
                    .toSorted(
                      (a, b) =>
                        new Date(b.updated_at).getTime() -
                        new Date(a.updated_at).getTime()
                    )
                    .map((contact) => (
                      <ContactRow
                        key={contact.id}
                        id={contact.id}
                        firstName={contact.first_name}
                        lastName={contact.last_name}
                        email={contact.email}
                        createdAt={contact.created_at}
                        category={categoryMap.get(contact.category_id ?? "")}
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
                        onMoveUp={() => handleMoveUp(contact.id)}
                        onMoveDown={() => handleMoveDown(contact.id)}
                      />
                    ))}
                </CategoryGroup>
              );
            })}

            {/* Uncategorized contacts */}
            {(() => {
              const uncategorizedContacts = groupedContacts?.get(null) ?? [];
              if (uncategorizedContacts.length === 0) return null;
              return (
                <UncategorizedGroup
                  contactIds={uncategorizedContacts.map((c) => c.id)}
                  count={uncategorizedContacts.length}
                  isHighlighted={hoveredCategoryId === "uncategorized"}
                >
                  {uncategorizedContacts
                    .toSorted(
                      (a, b) =>
                        new Date(b.updated_at).getTime() -
                        new Date(a.updated_at).getTime()
                    )
                    .map((contact) => (
                      <ContactRow
                        key={contact.id}
                        id={contact.id}
                        firstName={contact.first_name}
                        lastName={contact.last_name}
                        email={contact.email}
                        createdAt={contact.created_at}
                        isFirst={false}
                        isLast={true}
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
                        onMoveUp={() => handleMoveUp(contact.id)}
                        onMoveDown={() => handleMoveDown(contact.id)}
                      />
                    ))}
                </UncategorizedGroup>
              );
            })()}
          </div>
        </DndContext>
      ) : contacts.length === 0 ? (
        /* Empty state */
        <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <h3 className="mb-2 text-lg font-medium">{emptyTitle}</h3>
          <p className="text-muted-foreground text-center text-sm">
            {emptyDescription}
          </p>
        </div>
      ) : (
        /* Flat list (no categories) */
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
              {sortedContacts.map((contact, idx) => (
                <ContactRow
                  key={contact.id}
                  id={contact.id}
                  firstName={contact.first_name}
                  lastName={contact.last_name}
                  email={contact.email}
                  createdAt={contact.created_at}
                  isFirst={idx === 0}
                  isLast={idx === sortedContacts.length - 1}
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
                  onMoveUp={() => handleMoveUp(contact.id)}
                  onMoveDown={() => handleMoveDown(contact.id)}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}
    </div>
  );
}

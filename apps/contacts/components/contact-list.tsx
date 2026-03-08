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
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@helvety/ui/button";
import {
  BriefcaseIcon,
  Building2Icon,
  CircleIcon,
  Loader2Icon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { useCallback } from "react";

import { ContactRow } from "@/components/contact-row";

import type { DefaultCategory } from "@/lib/config/default-categories";
import type { Contact, ReorderUpdate } from "@/lib/types";

/** Renders a category icon from the configured category icon name. */
function renderCategoryIcon(icon: string, className = "size-4 shrink-0") {
  switch (icon) {
    case "users":
      return <UsersIcon className={className} />;
    case "briefcase":
      return <BriefcaseIcon className={className} />;
    case "building-2":
      return <Building2Icon className={className} />;
    case "circle":
      return <CircleIcon className={className} />;
    default:
      return <UserIcon className={className} />;
  }
}

/** Props for the contact list. */
interface ContactListProps {
  /** The contacts to display */
  contacts: Contact[];
  /** Whether contacts are currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Callback to retry after error */
  onRetry?: () => void;
  /** Callback when a contact row is clicked (fallback when contactHref not provided) */
  onContactClick?: (contact: Contact) => void;
  /** URL for contact navigation — use Link instead of imperative router.push callbacks where possible */
  contactHref?: (contact: Contact) => string;
  /** Callback used to prefetch a contact route on hover/focus */
  onContactPrefetch?: (contact: Contact) => void;
  /** Callback to delete a contact */
  onContactDelete?: (id: string, name: string) => void;
  /** Callback for batch reorder (drag-and-drop) */
  onReorder?: (updates: ReorderUpdate[]) => Promise<boolean>;
  /** Fixed categories used to group contacts in the list */
  categories: DefaultCategory[];
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
}

/**
 * ContactList - Category-grouped list component for contacts.
 */
export function ContactList({
  contacts,
  isLoading,
  error,
  onRetry,
  onContactClick,
  contactHref,
  onContactPrefetch,
  onContactDelete,
  onReorder,
  categories,
  emptyTitle = "No contacts yet",
  emptyDescription = "Create your first contact to get started.",
}: ContactListProps) {
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

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !onReorder) return;
      if (active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeContact = contacts.find((c) => c.id === activeId);
      const overContact = contacts.find((c) => c.id === overId);

      if (!activeContact || !overContact) return;
      if (activeContact.category_id !== overContact.category_id) {
        return;
      }

      const sortedContacts = contacts
        .filter((c) => c.category_id === activeContact.category_id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const oldIndex = sortedContacts.findIndex((c) => c.id === activeId);
      const newIndex = sortedContacts.findIndex((c) => c.id === overId);

      if (oldIndex === -1) return;

      sortedContacts.splice(oldIndex, 1);
      const insertAt = newIndex === -1 ? sortedContacts.length : newIndex;
      sortedContacts.splice(insertAt, 0, activeContact);

      const startIndex = Math.min(oldIndex, insertAt);
      const endIndex = Math.max(oldIndex, insertAt);
      const updates: ReorderUpdate[] = [];
      for (let index = startIndex; index <= endIndex; index++) {
        const contactAtIndex = sortedContacts[index];
        if (!contactAtIndex) continue;
        const originalContact = contacts.find(
          (c) => c.id === contactAtIndex.id
        );
        if (!originalContact) continue;

        const hasSortOrderChange = originalContact.sort_order !== index;
        const isActiveContact = contactAtIndex.id === activeId;
        if (!hasSortOrderChange) continue;

        const update: ReorderUpdate = {
          id: contactAtIndex.id,
          sort_order: index,
          category_id: activeContact.category_id,
        };
        void isActiveContact;
        updates.push(update);
      }

      if (updates.length === 0) return;

      await onReorder(updates);
    },
    [contacts, onReorder]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  // Error state - friendly UI with retry (toast already shown by hooks)
  if (error) {
    return (
      <div className="bg-muted/30 flex flex-col items-center justify-center gap-3 py-12">
        <p role="alert" className="text-muted-foreground text-sm">
          Something went wrong
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={() => onRetry()}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  const sortedContacts = [...contacts].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const groupedContacts = (() => {
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
  })();

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

      {contacts.length === 0 ? (
        /* Empty state */
        <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <h3 className="mb-2 text-lg font-medium">{emptyTitle}</h3>
          <p className="text-muted-foreground text-center text-sm">
            {emptyDescription}
          </p>
        </div>
      ) : (
        /* Category-grouped list */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            {categories.map((category) => {
              const categoryContacts = groupedContacts.get(category.id) ?? [];
              return (
                <section key={category.id} className="space-y-2">
                  <div
                    className="hover:bg-muted/40 flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
                    style={{ backgroundColor: `${category.color}14` }}
                  >
                    {renderCategoryIcon(category.icon)}
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <h2 className="text-sm font-medium">{category.name}</h2>
                    <span className="text-muted-foreground text-xs">
                      ({categoryContacts.length})
                    </span>
                  </div>
                  <div
                    className="border-border divide-border ml-2 overflow-hidden rounded-lg border border-l-2"
                    style={{ borderLeftColor: category.color }}
                  >
                    <SortableContext
                      items={categoryContacts.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
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
                          categoryIcon={category.icon}
                          href={contactHref?.(contact)}
                          onClick={() => onContactClick?.(contact)}
                          onPrefetch={() => onContactPrefetch?.(contact)}
                          onDelete={
                            onContactDelete
                              ? () =>
                                  onContactDelete(
                                    contact.id,
                                    `${contact.first_name} ${contact.last_name}`
                                  )
                              : undefined
                          }
                        />
                      ))}
                    </SortableContext>
                  </div>
                </section>
              );
            })}
          </div>
        </DndContext>
      )}
    </div>
  );
}

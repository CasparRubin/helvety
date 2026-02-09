"use client";

/**
 * Settings Panel - Side sheet with tabbed navigation for app configuration.
 * Accepts a flexible sections array so dashboards can define which tabs appear.
 * Designed to be scalable for future settings categories.
 */

import { SettingsIcon } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** A single settings section rendered as a tab. */
export interface SettingsSection {
  /** Unique identifier used as the tab value */
  id: string;
  /** Display label for the tab trigger */
  label: string;
  /** Optional icon displayed alongside the label */
  icon?: React.ComponentType<{ className?: string }>;
  /** Content rendered when this tab is active */
  content: React.ReactNode;
}

/** Props for the SettingsPanel component. */
interface SettingsPanelProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Ordered list of settings sections to render as tabs */
  sections: SettingsSection[];
}

/**
 * Renders a side-sheet settings panel with tabbed navigation.
 * Each section appears as a tab; the first section is active by default.
 */
export function SettingsPanel({
  open,
  onOpenChange,
  sections,
}: SettingsPanelProps) {
  const defaultTab = sections[0]?.id ?? "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SettingsIcon className="size-4" />
            Settings
          </SheetTitle>
          <SheetDescription>
            Configure stages, labels, and other preferences.
          </SheetDescription>
        </SheetHeader>

        {sections.length === 1 ? (
          /* Single section: skip tabs, render content directly */
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {sections[0]?.content}
          </div>
        ) : (
          /* Multiple sections: use tabbed navigation */
          <Tabs
            defaultValue={defaultTab}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="px-4 pt-2">
              <TabsList className="w-full">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <TabsTrigger key={section.id} value={section.id}>
                      {Icon && <Icon className="size-4" />}
                      {section.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {sections.map((section) => (
              <TabsContent
                key={section.id}
                value={section.id}
                className="flex-1 overflow-y-auto px-4 pb-4"
              >
                {section.content}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

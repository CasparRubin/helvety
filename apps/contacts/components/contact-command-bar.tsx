"use client";

/**
 * Contact command bar - sticky toolbar below navbar for the contacts list page.
 * Primary actions (always visible): create
 * Secondary actions (desktop inline, mobile dropdown): refresh, settings
 */

import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { CommandBar, CommandBarSpacer } from "@helvety/ui/command-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@helvety/ui/dropdown-menu";
import {
  DownloadIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  SettingsIcon,
} from "lucide-react";

/** Props for the ContactCommandBar component. */
interface ContactCommandBarProps {
  /** Callback to open the create dialog */
  onCreateClick: () => void;
  /** Callback to refresh the data */
  onRefresh?: () => void;
  /** Whether a refresh operation is in progress */
  isRefreshing?: boolean;
  /** Callback to open the settings panel */
  onSettings: () => void;
  /** Callback to export contact data (if provided, shows export button) */
  onExport?: () => void;
  /** Whether an export operation is in progress */
  isExporting?: boolean;
}

/**
 * Renders the contact command bar.
 */
export function ContactCommandBar({
  onCreateClick,
  onRefresh,
  isRefreshing,
  onSettings,
  onExport,
  isExporting,
}: ContactCommandBarProps) {
  return (
    <CommandBar>
      {/* Create button */}
      <Button size="sm" onClick={onCreateClick}>
        <PlusIcon className="mr-1.5 size-4 shrink-0" />
        <span>New Contact</span>
      </Button>

      {/* Desktop only: Refresh */}
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="hidden md:inline-flex"
        >
          <RefreshCwIcon
            className={cn(
              "mr-1.5 size-4 shrink-0",
              isRefreshing && "animate-spin"
            )}
          />
          <span>Refresh</span>
        </Button>
      )}

      <CommandBarSpacer />

      {/* Desktop only: Export, Settings */}
      {onExport && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="hidden md:inline-flex"
        >
          {isExporting ? (
            <Loader2Icon className="mr-1.5 size-4 shrink-0 animate-spin" />
          ) : (
            <DownloadIcon className="mr-1.5 size-4 shrink-0" />
          )}
          <span>{isExporting ? "Exporting..." : "Export Data"}</span>
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onSettings}
        className="hidden md:inline-flex"
      >
        <SettingsIcon className="mr-1.5 size-4 shrink-0" />
        <span>Settings</span>
      </Button>

      {/* Mobile only: overflow dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="md:hidden">
            <EllipsisVerticalIcon className="size-4" />
            <span className="sr-only">More actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onRefresh && (
            <DropdownMenuItem onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCwIcon className="mr-2 size-4" />
              <span>Refresh</span>
            </DropdownMenuItem>
          )}
          {onExport && (
            <DropdownMenuItem onClick={onExport} disabled={isExporting}>
              <DownloadIcon className="mr-2 size-4" />
              <span>{isExporting ? "Exporting..." : "Export Data"}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onSettings}>
            <SettingsIcon className="mr-2 size-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CommandBar>
  );
}

"use client";

import { cn } from "@helvety/shared/utils";
import {
  ArrowLeftIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "./button";
import { CommandBar, CommandBarSpacer } from "./command-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Separator } from "./separator";

import type { LucideIcon } from "lucide-react";

/** Props for the shared entity command bar. */
export interface EntityCommandBarProps {
  createLabel: string;
  onCreateClick: () => void;
  /** Optional second create action (e.g. Links “New folder”): inline on md+, mobile overflow menu. */
  secondaryCreateLabel?: string;
  onSecondaryCreateClick?: () => void;
  /** Icon for the secondary create action (defaults to plus). */
  secondaryCreateIcon?: LucideIcon;
  onBack?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onSettings?: () => void;
  onEdit?: () => void;
  editLabel?: string;
  onDelete?: () => void;
  deleteLabel?: string;
  onExport?: () => void;
  isExporting?: boolean;
}

/**
 * Shared responsive command bar used by entity list dashboards. Compose inside
 * `CommandBar`; pair with `CommandBarPageLayout` on E2EE dashboards so the bar
 * stays pinned while the list scrolls.
 */
export function EntityCommandBar({
  createLabel,
  onCreateClick,
  secondaryCreateLabel,
  onSecondaryCreateClick,
  secondaryCreateIcon = PlusIcon,
  onBack,
  onRefresh,
  isRefreshing,
  onSettings,
  onEdit,
  editLabel,
  onDelete,
  deleteLabel,
  onExport,
  isExporting,
}: EntityCommandBarProps): React.JSX.Element {
  const SecondaryIcon = secondaryCreateIcon;

  return (
    <CommandBar>
      {onBack && (
        <>
          <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back">
            <ArrowLeftIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
            <span className="sr-only min-[400px]:not-sr-only">Back</span>
          </Button>
          <Separator
            orientation="vertical"
            className="mx-2 hidden self-stretch md:block"
          />
        </>
      )}
      <Button size="sm" onClick={onCreateClick} aria-label={createLabel}>
        <PlusIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
        <span className="sr-only min-[400px]:not-sr-only">{createLabel}</span>
      </Button>
      {onSecondaryCreateClick && secondaryCreateLabel ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onSecondaryCreateClick}
          aria-label={secondaryCreateLabel}
          className="hidden md:inline-flex"
        >
          <SecondaryIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
          <span className="sr-only min-[400px]:not-sr-only">
            {secondaryCreateLabel}
          </span>
        </Button>
      ) : null}

      {onRefresh && (
        <>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh"
            className="md:hidden"
          >
            <RefreshCwIcon
              className={cn("size-4", isRefreshing && "animate-spin")}
            />
          </Button>
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
        </>
      )}

      <CommandBarSpacer />

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
      {onSettings && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSettings}
          className="hidden md:inline-flex"
        >
          <SettingsIcon className="mr-1.5 size-4 shrink-0" />
          <span>Settings</span>
        </Button>
      )}
      {onEdit && editLabel && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="hidden md:inline-flex"
        >
          <PencilIcon className="mr-1.5 size-4 shrink-0" />
          <span>{editLabel}</span>
        </Button>
      )}
      {onDelete && deleteLabel && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="hidden md:inline-flex"
        >
          <Trash2Icon className="mr-1.5 size-4 shrink-0" />
          <span>{deleteLabel}</span>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="md:hidden">
            <EllipsisVerticalIcon className="size-4" />
            <span className="sr-only">More actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onSecondaryCreateClick && secondaryCreateLabel ? (
            <DropdownMenuItem onClick={onSecondaryCreateClick}>
              <SecondaryIcon className="mr-2 size-4" />
              <span>{secondaryCreateLabel}</span>
            </DropdownMenuItem>
          ) : null}
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
          {onSettings && (
            <DropdownMenuItem onClick={onSettings}>
              <SettingsIcon className="mr-2 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          )}
          {onEdit && editLabel && (
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon className="mr-2 size-4" />
              <span>{editLabel}</span>
            </DropdownMenuItem>
          )}
          {onDelete && deleteLabel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2Icon className="mr-2 size-4" />
                <span>{deleteLabel}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </CommandBar>
  );
}

"use client";

import { getLoginUrl } from "@helvety/shared/auth-redirect";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { EncryptionGateApp } from "@helvety/ui/encryption-gate-app";
import { ScrollArea } from "@helvety/ui/scroll-area";
import { Loader2, LogIn, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { buildDocsPublicPath } from "@/lib/docs-zone-path";

import type { DocListItem } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

/** Props for {@link VaultPanel}. */
interface VaultPanelProps {
  readonly initialUser: User | null;
  readonly activeDocId: string | null;
  readonly documents: DocListItem[];
  readonly isLoading: boolean;
  readonly vaultEnabled: boolean;
  readonly onOpenDocument: (id: string) => void;
  readonly onDeleteDocument: (id: string) => void;
}

/** Encrypted document list inside the vault sidebar. */
function VaultDocumentList({
  documents,
  activeDocId,
  isLoading,
  onOpenDocument,
  onDeleteDocument,
}: {
  documents: DocListItem[];
  activeDocId: string | null;
  isLoading: boolean;
  onOpenDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
}): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 p-4 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading documents…
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-muted-foreground p-4 text-sm">
        No saved documents yet. Save from the toolbar when your vault is
        unlocked.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1 p-2">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center gap-1">
          <button
            type="button"
            className={cn(
              "hover:bg-accent min-w-0 flex-1 rounded-md px-3 py-2 text-left text-sm",
              activeDocId === doc.id && "bg-accent font-medium"
            )}
            onClick={() => onOpenDocument(doc.id)}
          >
            <span className="block truncate">{doc.title}</span>
            <span className="text-muted-foreground text-xs">
              {new Date(doc.updated_at).toLocaleString()}
            </span>
          </button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="shrink-0"
            aria-label={`Delete ${doc.title}`}
            onClick={() => onDeleteDocument(doc.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Sidebar listing encrypted vault documents (gated when session exists). */
export function VaultPanel({
  initialUser,
  activeDocId,
  documents,
  isLoading,
  vaultEnabled,
  onOpenDocument,
  onDeleteDocument,
}: VaultPanelProps): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Gateway-visible /docs… so post-login redirect returns here (not site home).
  const loginHref = getLoginUrl(
    buildDocsPublicPath(pathname, searchParams.toString())
  );

  return (
    <aside className="border-border bg-card flex w-72 shrink-0 flex-col border-r">
      <div className="border-border border-b px-4 py-3">
        <h2 className="text-sm font-semibold">My documents</h2>
        <p className="text-muted-foreground text-xs">
          Optional encrypted cloud save
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {!initialUser ? (
          <div className="flex flex-col gap-3 p-4">
            <p className="text-muted-foreground text-sm">
              Sign in to save documents encrypted in your vault.
            </p>
            <Button size="sm" asChild>
              <Link href={loginHref}>
                <LogIn className="mr-2 size-4" />
                Sign in
              </Link>
            </Button>
          </div>
        ) : (
          <EncryptionGateApp userId={initialUser.id}>
            <VaultDocumentList
              documents={vaultEnabled ? documents : []}
              activeDocId={activeDocId}
              isLoading={vaultEnabled && isLoading}
              onOpenDocument={onOpenDocument}
              onDeleteDocument={onDeleteDocument}
            />
          </EncryptionGateApp>
        )}
      </ScrollArea>
    </aside>
  );
}

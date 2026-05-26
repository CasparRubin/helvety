"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";
import { DOCS_FILE_SIZE_LIMIT_COPY } from "@helvety/shared/product-file-limit-copy";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { DocsCommandBar } from "@/components/docs-command-bar";
import { SaveVaultDialog } from "@/components/save-vault-dialog";
import { VaultDocumentsSheet } from "@/components/vault-documents-sheet";
import { useDocs } from "@/hooks/use-docs";
import { MAX_DOCX_BYTES } from "@/lib/constants";
import { normalizeDocxSaveResult } from "@/lib/docx-bytes";

import type { DocxEditorRef } from "@eigenpal/docx-editor-react";
import type { User } from "@helvety/shared/supabase-types";

const DocxEditorWorkspace = dynamic(
  () =>
    import("@/components/docx-editor-workspace").then(
      (m) => m.DocxEditorWorkspace
    ),
  {
    ssr: false,
    loading: () => (
      <div className="bg-background text-muted-foreground flex h-full min-h-0 flex-1 items-center justify-center text-sm">
        Loading editor…
      </div>
    ),
  }
);

/** Read a local `.docx` file into memory for the editor. */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

/** Derive a vault title from an optional local filename. */
function defaultDocumentTitle(fileName?: string): string {
  if (fileName) {
    return fileName.replace(/\.docx$/i, "") || "Untitled";
  }
  return "Untitled";
}

/** Props for {@link HelvetyDocsShell}. */
interface HelvetyDocsShellProps {
  readonly initialUser: User | null;
}

/** Main Docs workspace: public blank local editor plus optional encrypted vault. */
export function HelvetyDocsShell({
  initialUser,
}: HelvetyDocsShellProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<DocxEditorRef>(null);

  const { isUnlocked } = useEncryptionContext();
  const vaultEnabled = !!initialUser && isUnlocked;

  const {
    documents,
    isLoading: vaultLoading,
    loadDocument,
    saveDocument,
    remove,
  } = useDocs(vaultEnabled);

  const [documentBuffer, setDocumentBuffer] = useState<ArrayBuffer | null>(
    null
  );
  const [editorSessionKey, setEditorSessionKey] = useState(0);
  const [vaultDocId, setVaultDocId] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [pendingSaveTitle, setPendingSaveTitle] = useState("Untitled");
  const [vaultSheetOpen, setVaultSheetOpen] = useState(false);
  /** First-paint `?doc=` only; do not strip when the user opens a vault doc later. */
  const initialDocIdRef = useRef(searchParams.get("doc"));
  const strippedInitialDeepLinkRef = useRef(false);

  const validateDocxSize = useCallback(
    (bytes: ArrayBuffer, label: string): boolean => {
      if (bytes.byteLength > MAX_DOCX_BYTES) {
        toast.error(
          `${label} exceeds the ${DOCS_FILE_SIZE_LIMIT_COPY} limit.`,
          {
            duration: TOAST_DURATIONS.ERROR,
          }
        );
        return false;
      }
      return true;
    },
    []
  );

  /**
   * Sync `?doc=` when the user opens or saves a vault document (not on landing).
   * Zone-relative paths; see `lib/docs-zone-path.ts`.
   */
  const setDocInUrl = useCallback(
    (docId: string | null) => {
      const currentDoc = searchParams.get("doc");
      if (docId) {
        if (currentDoc === docId) {
          return;
        }
      } else if (!currentDoc) {
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      if (docId) {
        params.set("doc", docId);
      } else {
        params.delete("doc");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const bumpEditorSession = useCallback(() => {
    setEditorSessionKey((key) => key + 1);
  }, []);

  const handleNewDocument = useCallback(() => {
    // Remount editor with createEmptyDocument() (see docx-editor-workspace.tsx).
    bumpEditorSession();
    setDocumentBuffer(null);
    setVaultDocId(null);
    setLocalFileName(null);
    setDocInUrl(null);
  }, [bumpEditorSession, setDocInUrl]);

  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".docx")) {
        toast.error("Please choose a .docx file.", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return;
      }
      try {
        const buffer = await readFileAsArrayBuffer(file);
        if (!validateDocxSize(buffer, file.name)) return;
        bumpEditorSession();
        setDocumentBuffer(buffer);
        setVaultDocId(null);
        setLocalFileName(file.name);
        setDocInUrl(null);
      } catch {
        toast.error("Could not open that file.", {
          duration: TOAST_DURATIONS.ERROR,
        });
      }
    },
    [bumpEditorSession, setDocInUrl, validateDocxSize]
  );

  const documentDisplayName = useMemo(() => {
    if (localFileName) {
      return localFileName.replace(/\.docx$/i, "") || "Untitled";
    }
    const existing = documents.find((d) => d.id === vaultDocId);
    return existing?.title ?? defaultDocumentTitle();
  }, [documents, localFileName, vaultDocId]);

  const handleDocumentNameChange = useCallback((name: string) => {
    const trimmed = name.trim() || "Untitled";
    setLocalFileName(`${trimmed}.docx`);
  }, []);

  const handleDownload = useCallback(
    async (bufferFromSave?: ArrayBuffer) => {
      const bytes =
        bufferFromSave !== undefined
          ? normalizeDocxSaveResult(bufferFromSave)
          : normalizeDocxSaveResult(await editorRef.current?.save());
      if (!bytes) {
        toast.error("Nothing to download yet.", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return;
      }
      if (!validateDocxSize(bytes, "Document")) return;

      const downloadName = localFileName ?? `${defaultDocumentTitle()}.docx`;
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = downloadName;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    [localFileName, validateDocxSize]
  );

  const performVaultSave = useCallback(
    async (title: string) => {
      const bytes = normalizeDocxSaveResult(await editorRef.current?.save());
      if (!bytes) {
        toast.error("Could not read the document for saving.", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return;
      }
      if (!validateDocxSize(bytes, title)) return;

      setIsSaving(true);
      try {
        const id = await saveDocument(
          { title, docxBytes: bytes },
          vaultDocId ?? undefined
        );
        if (id) {
          setVaultDocId(id);
          setDocInUrl(id);
          toast.success(
            vaultDocId ? "Vault document updated." : "Saved to vault.",
            { duration: TOAST_DURATIONS.SUCCESS }
          );
        }
      } finally {
        setIsSaving(false);
        setSaveDialogOpen(false);
      }
    },
    [saveDocument, setDocInUrl, validateDocxSize, vaultDocId]
  );

  const handleSaveToVault = useCallback(() => {
    if (!initialUser) {
      toast.error("Sign in to save to your vault.", {
        duration: TOAST_DURATIONS.ERROR,
      });
      return;
    }
    if (!isUnlocked) {
      toast.error("Unlock your vault to save documents.", {
        duration: TOAST_DURATIONS.ERROR,
      });
      return;
    }
    const existing = documents.find((d) => d.id === vaultDocId);
    setPendingSaveTitle(
      existing?.title ?? defaultDocumentTitle(localFileName ?? undefined)
    );
    setSaveDialogOpen(true);
  }, [documents, initialUser, isUnlocked, localFileName, vaultDocId]);

  const handleOpenVaultDocument = useCallback(
    async (id: string) => {
      const doc = await loadDocument(id);
      if (!doc) return;
      if (!validateDocxSize(doc.docxBytes, doc.title)) return;
      bumpEditorSession();
      setDocumentBuffer(doc.docxBytes);
      setVaultDocId(doc.id);
      setLocalFileName(`${doc.title}.docx`);
      setDocInUrl(id);
      setVaultSheetOpen(false);
    },
    [bumpEditorSession, loadDocument, setDocInUrl, validateDocxSize]
  );

  const handleDeleteVaultDocument = useCallback(
    async (id: string) => {
      const ok = await remove(id);
      if (!ok) return;
      if (vaultDocId === id) {
        handleNewDocument();
      }
      toast.success("Document removed from vault.", {
        duration: TOAST_DURATIONS.SUCCESS,
      });
    },
    [handleNewDocument, remove, vaultDocId]
  );

  /** Always start blank; strip landing `?doc=` without auto-opening vault docs. */
  useEffect(() => {
    if (strippedInitialDeepLinkRef.current) return;
    if (!initialDocIdRef.current) return;
    strippedInitialDeepLinkRef.current = true;
    setDocInUrl(null);
  }, [setDocInUrl]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={(e) => void handleFileChange(e)}
      />
      <DocsCommandBar
        isSaving={isSaving}
        canSaveToVault={vaultEnabled}
        vaultDocId={vaultDocId}
        showMyDocuments={!!initialUser}
        onNewDocument={handleNewDocument}
        onOpenFile={handleOpenFile}
        onDownload={() => void handleDownload()}
        onSaveToVault={handleSaveToVault}
        onOpenMyDocuments={() => setVaultSheetOpen(true)}
      />
      <div className="bg-background flex min-h-0 flex-1 overflow-hidden">
        <DocxEditorWorkspace
          ref={editorRef}
          documentBuffer={documentBuffer}
          sessionKey={editorSessionKey}
          documentName={documentDisplayName}
          onDocumentNameChange={handleDocumentNameChange}
          onDownload={(buffer) => void handleDownload(buffer)}
        />
      </div>
      {initialUser ? (
        <VaultDocumentsSheet
          open={vaultSheetOpen}
          onOpenChange={setVaultSheetOpen}
          initialUser={initialUser}
          activeDocId={vaultDocId}
          documents={documents}
          isLoading={vaultLoading}
          vaultEnabled={vaultEnabled}
          onOpenDocument={(id) => void handleOpenVaultDocument(id)}
          onDeleteDocument={(id) => void handleDeleteVaultDocument(id)}
        />
      ) : null}
      <SaveVaultDialog
        open={saveDialogOpen}
        defaultTitle={pendingSaveTitle}
        isUpdate={!!vaultDocId}
        onOpenChange={setSaveDialogOpen}
        onConfirm={(title) => void performVaultSave(title)}
      />
    </div>
  );
}

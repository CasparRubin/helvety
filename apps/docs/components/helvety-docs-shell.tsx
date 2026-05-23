"use client";

import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";
import { DOCS_FILE_SIZE_LIMIT_COPY } from "@helvety/shared/product-file-limit-copy";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DocsCommandBar } from "@/components/docs-command-bar";
import { SaveVaultDialog } from "@/components/save-vault-dialog";
import { VaultPanel } from "@/components/vault-panel";
import { useDocs } from "@/hooks/use-docs";
import { MAX_DOCX_BYTES } from "@/lib/constants";
import { normalizeDocxSaveResult } from "@/lib/docx-bytes";

import type { DocxEditorRef } from "@eigenpal/docx-editor-react";
import type { User } from "@supabase/supabase-js";

const DocxEditorWorkspace = dynamic(
  () =>
    import("@/components/docx-editor-workspace").then(
      (m) => m.DocxEditorWorkspace
    ),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        Loading editor…
      </div>
    ),
  }
);

/**
 *
 */
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

/**
 *
 */
function defaultDocumentTitle(fileName?: string): string {
  if (fileName) {
    return fileName.replace(/\.docx$/i, "") || "Untitled";
  }
  return "Untitled";
}

/**
 *
 */
interface HelvetyDocsShellProps {
  readonly initialUser: User | null;
}

/** Main Docs workspace: local editor plus optional encrypted vault. */
export function HelvetyDocsShell({
  initialUser,
}: HelvetyDocsShellProps): React.JSX.Element {
  const router = useRouter();
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

  const [documentBuffer, setDocumentBuffer] = useState<
    ArrayBuffer | null | undefined
  >(null);
  const [vaultDocId, setVaultDocId] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [pendingSaveTitle, setPendingSaveTitle] = useState("Untitled");
  const loadedDeepLinkRef = useRef<string | null>(null);

  const validateDocxSize = useCallback(
    (bytes: ArrayBuffer, label: string): boolean => {
      if (bytes.byteLength > MAX_DOCX_BYTES) {
        toast.error(`${label} exceeds the ${DOCS_FILE_SIZE_LIMIT_COPY} limit.`);
        return false;
      }
      return true;
    },
    []
  );

  const handleNewDocument = useCallback(() => {
    setDocumentBuffer(null);
    setVaultDocId(null);
    setLocalFileName(null);
    router.replace("/docs");
  }, [router]);

  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".docx")) {
        toast.error("Please choose a .docx file.");
        return;
      }
      try {
        const buffer = await readFileAsArrayBuffer(file);
        if (!validateDocxSize(buffer, file.name)) return;
        setDocumentBuffer(buffer);
        setVaultDocId(null);
        setLocalFileName(file.name);
        router.replace("/docs");
      } catch {
        toast.error("Could not open that file.");
      }
    },
    [router, validateDocxSize]
  );

  const handleDownload = useCallback(async () => {
    const bytes = normalizeDocxSaveResult(await editorRef.current?.save());
    if (!bytes) {
      toast.error("Nothing to download yet.");
      return;
    }
    if (!validateDocxSize(bytes, "Document")) return;

    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = localFileName ?? `${defaultDocumentTitle()}.docx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [localFileName, validateDocxSize]);

  const performVaultSave = useCallback(
    async (title: string) => {
      const bytes = normalizeDocxSaveResult(await editorRef.current?.save());
      if (!bytes) {
        toast.error("Could not read the document for saving.");
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
          router.replace(`/docs?doc=${id}`);
          toast.success(
            vaultDocId ? "Vault document updated." : "Saved to vault."
          );
        }
      } finally {
        setIsSaving(false);
        setSaveDialogOpen(false);
      }
    },
    [router, saveDocument, validateDocxSize, vaultDocId]
  );

  const handleSaveToVault = useCallback(() => {
    if (!initialUser) {
      toast.error("Sign in to save to your vault.");
      return;
    }
    if (!isUnlocked) {
      toast.error("Unlock your vault to save documents.");
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
      setDocumentBuffer(doc.docxBytes);
      setVaultDocId(doc.id);
      setLocalFileName(`${doc.title}.docx`);
      router.replace(`/docs?doc=${id}`);
    },
    [loadDocument, router, validateDocxSize]
  );

  const handleDeleteVaultDocument = useCallback(
    async (id: string) => {
      const ok = await remove(id);
      if (!ok) return;
      if (vaultDocId === id) {
        handleNewDocument();
      }
      toast.success("Document removed from vault.");
    },
    [handleNewDocument, remove, vaultDocId]
  );

  useEffect(() => {
    const docId = searchParams.get("doc");
    if (!docId || !vaultEnabled) return;
    if (loadedDeepLinkRef.current === docId) return;
    loadedDeepLinkRef.current = docId;
    void handleOpenVaultDocument(docId);
  }, [handleOpenVaultDocument, searchParams, vaultEnabled]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DocsCommandBar
        hasDocument={documentBuffer !== undefined}
        isSaving={isSaving}
        canSaveToVault={vaultEnabled}
        vaultDocId={vaultDocId}
        onNewDocument={handleNewDocument}
        onOpenFile={handleOpenFile}
        onDownload={() => void handleDownload()}
        onSaveToVault={handleSaveToVault}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={(e) => void handleFileChange(e)}
      />
      <div className="flex min-h-0 flex-1">
        <VaultPanel
          initialUser={initialUser}
          activeDocId={vaultDocId}
          documents={documents}
          isLoading={vaultLoading}
          vaultEnabled={vaultEnabled}
          onOpenDocument={(id) => void handleOpenVaultDocument(id)}
          onDeleteDocument={(id) => void handleDeleteVaultDocument(id)}
        />
        <DocxEditorWorkspace ref={editorRef} documentBuffer={documentBuffer} />
      </div>
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

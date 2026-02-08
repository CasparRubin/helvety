"use client";

import {
  DownloadIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  PaperclipIcon,
  Trash2Icon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAttachments } from "@/hooks";
import { ATTACHMENT_MAX_SIZE_BYTES } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

import type { UploadProgress } from "@/hooks";
import type { Attachment } from "@/lib/types";

// =============================================================================
// Helpers
// =============================================================================

/** Check if a MIME type represents an image */
function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/** Format file size for display */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Get a readable label for upload status */
function getUploadStatusLabel(status: UploadProgress["status"]): string {
  switch (status) {
    case "encrypting":
      return "Encrypting...";
    case "uploading":
      return "Uploading...";
    case "saving":
      return "Saving...";
    case "done":
      return "Done";
    case "error":
      return "Failed";
  }
}

/** Get an icon component for non-image files based on MIME type */
function FileTypeIcon({
  mimeType,
  className,
}: {
  mimeType: string;
  className?: string;
}): React.JSX.Element {
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className={className} />;
  }
  if (
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet")
  ) {
    return <FileTextIcon className={className} />;
  }
  return <FileIcon className={className} />;
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * A single attachment thumbnail in the grid.
 * Images show a decrypted thumbnail; other files show a type icon.
 */
function AttachmentThumbnail({
  attachment,
  onPreview,
  onDownload,
  onDelete,
  downloadUrl,
}: {
  attachment: Attachment;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
  downloadUrl: (attachment: Attachment) => Promise<string | null>;
}): React.JSX.Element {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoadingThumb, setIsLoadingThumb] = useState(false);
  const isImage = isImageMime(attachment.metadata.mime_type);

  // Load thumbnail for image attachments
  useEffect(() => {
    if (!isImage) return;

    let cancelled = false;
    setIsLoadingThumb(true);

    void downloadUrl(attachment).then((url) => {
      if (!cancelled) {
        setThumbnailUrl(url);
        setIsLoadingThumb(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // Only re-run when the attachment ID changes, not on every downloadUrl reference change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment.id, isImage]);

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border",
        "bg-muted/30 hover:bg-muted/60 transition-colors"
      )}
    >
      {/* Thumbnail / Icon area */}
      <button
        type="button"
        onClick={isImage ? onPreview : onDownload}
        className="flex h-28 w-full items-center justify-center overflow-hidden focus:outline-none"
        title={
          isImage
            ? `Preview ${attachment.metadata.filename}`
            : `Download ${attachment.metadata.filename}`
        }
      >
        {isImage && isLoadingThumb && (
          <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
        )}
        {isImage && thumbnailUrl && (
          /* eslint-disable-next-line @next/next/no-img-element -- decrypted blob URL, not optimizable */
          <img
            src={thumbnailUrl}
            alt={attachment.metadata.filename}
            className="h-full w-full object-cover"
          />
        )}
        {isImage && !isLoadingThumb && !thumbnailUrl && (
          <ImageIcon className="text-muted-foreground size-8" />
        )}
        {!isImage && (
          <FileTypeIcon
            mimeType={attachment.metadata.mime_type}
            className="text-muted-foreground size-8"
          />
        )}
      </button>

      {/* File info */}
      <div className="flex items-center gap-1.5 border-t px-2 py-1.5">
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-xs font-medium"
            title={attachment.metadata.filename}
          >
            {attachment.metadata.filename}
          </p>
          <p className="text-muted-foreground text-[10px]">
            {formatFileSize(attachment.metadata.size)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onDownload}
            title="Download"
          >
            <DownloadIcon className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
            className="text-destructive hover:text-destructive"
          >
            <Trash2Icon className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Progress indicator for an in-flight upload
 */
function UploadProgressCard({
  progress,
}: {
  progress: UploadProgress;
}): React.JSX.Element {
  const isError = progress.status === "error";
  const isDone = progress.status === "done";

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border",
        isError && "border-destructive/50",
        isDone && "border-green-500/50"
      )}
    >
      <div className="flex h-28 items-center justify-center">
        {!isError && !isDone && (
          <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
        )}
        {isDone && (
          <div className="text-green-500">
            <UploadCloudIcon className="size-6" />
          </div>
        )}
        {isError && (
          <div className="text-destructive">
            <XIcon className="size-6" />
          </div>
        )}
      </div>
      <div className="border-t px-2 py-1.5">
        <p className="truncate text-xs font-medium" title={progress.filename}>
          {progress.filename}
        </p>
        <p
          className={cn(
            "text-[10px]",
            isError ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {isError && progress.error
            ? progress.error
            : getUploadStatusLabel(progress.status)}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Attachment panel for displaying, uploading, and managing encrypted file
 * attachments on an item. Renders below the description editor.
 *
 * All file operations are fully E2EE:
 * - Upload: file is encrypted client-side before upload
 * - Download/Preview: encrypted blob is decrypted client-side
 * - Metadata (filename, type, size) is encrypted in the database
 */
export function AttachmentPanel({
  itemId,
}: {
  itemId: string;
}): React.JSX.Element {
  const {
    attachments,
    isLoading,
    uploads,
    upload,
    remove,
    downloadUrl,
    downloadFile,
  } = useAttachments(itemId);

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image preview dialog state
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle file selection (from input or drop)
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        if (file.size > ATTACHMENT_MAX_SIZE_BYTES) {
          const maxMB = Math.round(ATTACHMENT_MAX_SIZE_BYTES / (1024 * 1024));
          // Skip oversized files with a warning (the hook also validates)
          logger.warn(`Skipping "${file.name}": exceeds ${maxMB}MB limit`);
          continue;
        }
        // Upload sequentially to avoid overwhelming the browser with parallel encryptions
        await upload(file);
      }
    },
    [upload]
  );

  // Drag-and-drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        void handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // Image preview
  const openPreview = useCallback(
    async (attachment: Attachment) => {
      setPreviewAttachment(attachment);
      setIsLoadingPreview(true);
      setPreviewUrl(null);

      const url = await downloadUrl(attachment);
      setPreviewUrl(url);
      setIsLoadingPreview(false);
    },
    [downloadUrl]
  );

  const closePreview = useCallback(() => {
    setPreviewAttachment(null);
    setPreviewUrl(null);
    setIsLoadingPreview(false);
  }, []);

  // Delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await remove(deleteTarget.id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, remove]);

  const hasContent = attachments.length > 0 || uploads.length > 0 || isLoading;

  return (
    <>
      <div className="space-y-3">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <PaperclipIcon className="text-muted-foreground size-4" />
          <h3 className="text-muted-foreground text-sm font-medium">
            Attachments
          </h3>
          {attachments.length > 0 && (
            <span className="text-muted-foreground text-xs">
              ({attachments.length})
            </span>
          )}
        </div>

        {/* Drop zone + file input */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"
          )}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <UploadCloudIcon
            className={cn(
              "mb-1.5 size-6",
              isDragging ? "text-primary" : "text-muted-foreground"
            )}
          />
          <p className="text-muted-foreground text-xs">
            {isDragging ? (
              "Drop files here"
            ) : (
              <>
                Drag & drop files or{" "}
                <span className="text-primary font-medium">browse</span>
              </>
            )}
          </p>
          <p className="text-muted-foreground/60 mt-0.5 text-[10px]">
            Max {Math.round(ATTACHMENT_MAX_SIZE_BYTES / (1024 * 1024))}MB per
            file &middot; Files are end-to-end encrypted
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                void handleFiles(e.target.files);
                // Reset input so the same file can be re-uploaded
                e.target.value = "";
              }
            }}
          />
        </div>

        {/* Loading state */}
        {isLoading && !hasContent && (
          <div className="flex items-center justify-center py-4">
            <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}

        {/* Attachment grid */}
        {(attachments.length > 0 || uploads.length > 0) && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {/* Active uploads */}
            {uploads.map((progress) => (
              <UploadProgressCard key={progress.id} progress={progress} />
            ))}

            {/* Existing attachments */}
            {attachments.map((attachment) => (
              <AttachmentThumbnail
                key={attachment.id}
                attachment={attachment}
                onPreview={() => void openPreview(attachment)}
                onDownload={() => void downloadFile(attachment)}
                onDelete={() => setDeleteTarget(attachment)}
                downloadUrl={downloadUrl}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image preview dialog */}
      <Dialog
        open={previewAttachment !== null}
        onOpenChange={(open) => {
          if (!open) closePreview();
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">
              {previewAttachment?.metadata.filename ?? "Preview"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Image preview for {previewAttachment?.metadata.filename}
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-[200px] items-center justify-center">
            {isLoadingPreview && (
              <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
            )}
            {previewUrl && (
              /* eslint-disable-next-line @next/next/no-img-element -- decrypted blob URL, not optimizable */
              <img
                src={previewUrl}
                alt={previewAttachment?.metadata.filename ?? ""}
                className="max-h-[70vh] w-full rounded-md object-contain"
              />
            )}
            {!isLoadingPreview && !previewUrl && (
              <p className="text-muted-foreground text-sm">
                Failed to load preview
              </p>
            )}
          </div>
          {previewAttachment && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {formatFileSize(previewAttachment.metadata.size)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void downloadFile(previewAttachment)}
              >
                <DownloadIcon className="size-3.5" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;
              {deleteTarget?.metadata.filename}&rdquo;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

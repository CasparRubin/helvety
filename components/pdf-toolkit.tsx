"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { addOklchAlpha } from "@/lib/pdf-colors"
import { Download, Loader2, Trash2, X, Upload } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface PdfFile {
  id: string
  file: File
  url: string
  pageCount: number
  color: string
}

interface PdfToolkitProps {
  pdfFiles: PdfFile[]
  totalPages: number
  deletedCount: number
  rotatedCount: number
  onDownload: () => void
  onClearAll: () => void
  onRemoveFile: (fileId: string) => void
  onAddFiles: () => void
  isProcessing: boolean
  columns?: number
  onColumnsChange?: (columns: number) => void
}

export function PdfToolkit({
  pdfFiles,
  totalPages,
  deletedCount,
  rotatedCount,
  onDownload,
  onClearAll,
  onRemoveFile,
  onAddFiles,
  isProcessing,
  columns,
  onColumnsChange,
}: PdfToolkitProps) {
  const [showColumnSlider, setShowColumnSlider] = React.useState(false)

  // Detect if screen width shows more than 1 column (>= 1231px)
  React.useEffect(() => {
    const checkScreenWidth = () => {
      setShowColumnSlider(window.innerWidth >= 1231)
    }

    // Check on mount
    checkScreenWidth()

    // Listen for resize events
    window.addEventListener("resize", checkScreenWidth)
    return () => window.removeEventListener("resize", checkScreenWidth)
  }, [])
  return (
    <div className={cn(
      "flex",
      "w-full lg:w-80 flex-shrink-0",
      "flex-col gap-6",
      "lg:sticky lg:top-24 lg:self-start",
      "lg:h-[calc(100vh-8rem)]",
      "order-last lg:order-none"
    )}>
      <div className={cn(
        "bg-muted/30 border border-border/50 p-4 lg:p-6",
        "flex flex-col gap-4 lg:gap-6",
        "lg:overflow-y-auto",
        "max-h-[60vh] lg:max-h-none overflow-y-auto"
      )}>
        {/* Actions - Always at top */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Actions</h3>
          <div className="space-y-2">
            {pdfFiles.length > 0 && (
              <Button
                onClick={onDownload}
                disabled={isProcessing || pdfFiles.length === 0}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={onAddFiles}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              {pdfFiles.length === 0 ? "Add Files" : "Add More Files"}
            </Button>
            {pdfFiles.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={isProcessing || pdfFiles.length === 0}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Files?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all PDF files and pages from the canvas. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onClearAll}
                      variant="destructive"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Display - Column Slider (only show when screen width >= 1231px and files are uploaded) */}
        {pdfFiles.length > 0 && showColumnSlider && columns !== undefined && onColumnsChange && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Display</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="column-slider" className="text-sm">
                  Pages per row
                </Label>
                <span className="text-xs text-muted-foreground">
                  {columns} {columns === 1 ? "page" : "pages"}
                </span>
              </div>
              <Slider
                id="column-slider"
                min={2}
                max={10}
                step={1}
                value={[columns]}
                onValueChange={(value) => onColumnsChange(value[0])}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Statistics */}
        {pdfFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Pages</span>
                  <Badge variant="secondary">{totalPages}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">PDF Files</span>
                <Badge variant="secondary">{pdfFiles.length}</Badge>
              </div>
              {deletedCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deleted</span>
                  <Badge variant="destructive">{deletedCount}</Badge>
                </div>
              )}
              {rotatedCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rotated</span>
                  <Badge variant="default">{rotatedCount}</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* File List */}
        {pdfFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Files</h3>
            <div className="space-y-2">
              {pdfFiles.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md",
                    "border border-border",
                    "group"
                  )}
                  style={{
                    backgroundColor: addOklchAlpha(file.color, 0.15)
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: file.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" title={file.file.name}>
                      {file.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.pageCount} {file.pageCount === 1 ? "page" : "pages"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveFile(file.id)}
                    disabled={isProcessing}
                    aria-label={`Remove ${file.file.name}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


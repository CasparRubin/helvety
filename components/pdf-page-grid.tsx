"use client"

// React
import * as React from "react"

// External libraries
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  Trash2,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Download
} from "lucide-react"

// Internal components
import { PdfPageThumbnail } from "@/components/pdf-page-thumbnail"
import { PdfActionButtons } from "@/components/pdf-action-buttons"
import { Badge } from "@/components/ui/badge"

// Internal utilities
import { cn } from "@/lib/utils"
import { addOklchAlpha } from "@/lib/pdf-colors"
import { createPageMap, createFileMap, createFileUrlMap } from "@/lib/pdf-lookup-utils"
import { ROTATION_ANGLES } from "@/lib/constants"

// Types
import type { PdfFile, UnifiedPage } from "@/lib/types"

interface PdfPageGridProps {
  pdfFiles: PdfFile[]
  unifiedPages: UnifiedPage[]
  pageOrder: number[]
  deletedPages: Set<number>
  pageRotations: Record<number, number>
  onReorder: (newOrder: number[]) => void
  onToggleDelete: (unifiedPageNumber: number) => void
  onRotate: (unifiedPageNumber: number, angle: number) => void
  onResetRotation: (unifiedPageNumber: number) => void
  onExtract: (unifiedPageNumber: number) => void
  isProcessing: boolean
  columns?: number
}

function PdfPageGridComponent({
  pdfFiles,
  unifiedPages,
  pageOrder,
  deletedPages,
  pageRotations,
  onReorder,
  onToggleDelete,
  onRotate,
  onResetRotation,
  onExtract,
  isProcessing,
  columns,
}: PdfPageGridProps): React.JSX.Element | null {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const handleDragStart = React.useCallback((index: number): void => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = React.useCallback((e: React.DragEvent, index: number): void => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }, [draggedIndex])

  const handleDragLeave = React.useCallback((): void => {
    setDragOverIndex(null)
  }, [])

  const handleDrop = React.useCallback((e: React.DragEvent, dropIndex: number): void => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newOrder = [...pageOrder]
    const draggedPage = newOrder[draggedIndex]
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(dropIndex, 0, draggedPage)
    onReorder(newOrder)

    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [draggedIndex, pageOrder, onReorder])

  const handleDragEnd = React.useCallback((): void => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  const handleMoveUp = React.useCallback((index: number): void => {
    if (index === 0) return
    const newOrder = [...pageOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp
    onReorder(newOrder)
  }, [pageOrder, onReorder])

  const handleMoveDown = React.useCallback((index: number): void => {
    if (index === pageOrder.length - 1) return
    const newOrder = [...pageOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index + 1]
    newOrder[index + 1] = temp
    onReorder(newOrder)
  }, [pageOrder, onReorder])

  const handleMoveLeft = React.useCallback((index: number): void => {
    handleMoveUp(index)
  }, [handleMoveUp])

  const handleMoveRight = React.useCallback((index: number): void => {
    handleMoveDown(index)
  }, [handleMoveDown])

  // Create memoized maps for O(1) lookups instead of O(n) Array.find()
  const pageInfoMap = React.useMemo(() => createPageMap(unifiedPages), [unifiedPages])
  const fileInfoMap = React.useMemo(() => createFileMap(pdfFiles), [pdfFiles])
  const fileUrlMap = React.useMemo(() => createFileUrlMap(pdfFiles), [pdfFiles])

  // Memoize final page number calculations to avoid recalculating on every render
  const finalPageNumberMap = React.useMemo(() => {
    const map = new Map<number, number | null>()
    let finalPageNum = 0
    pageOrder.forEach((unifiedPageNumber) => {
      if (!deletedPages.has(unifiedPageNumber)) {
        finalPageNum++
        map.set(unifiedPageNumber, finalPageNum)
      } else {
        map.set(unifiedPageNumber, null)
      }
    })
    return map
  }, [pageOrder, deletedPages])

  // Get page info for display
  const getPageInfo = (unifiedPageNumber: number) => {
    return pageInfoMap.get(unifiedPageNumber)
  }

  const getFileUrl = (fileId: string) => {
    return fileUrlMap.get(fileId)
  }

  const getFileInfo = (fileId: string) => {
    return fileInfoMap.get(fileId)
  }

  const getFinalPageNumber = (unifiedPageNumber: number): number | null => {
    return finalPageNumberMap.get(unifiedPageNumber) ?? null
  }

  if (pageOrder.length === 0) {
    return null
  }

  // Use dynamic columns if provided, otherwise fall back to CSS classes
  const gridStyle = columns
    ? {
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        marginTop: 0,
        paddingTop: 0,
      }
    : { marginTop: 0, paddingTop: 0 }

  const gridClassName = columns
    ? "grid gap-6"
    : "grid grid-cols-1 grid-cols-2-at-1230 grid-cols-3-at-1655 gap-6"

  return (
    <div 
      className={gridClassName} 
      style={gridStyle}
      role="list"
      aria-label="PDF pages grid"
    >
      {pageOrder.map((unifiedPageNumber, index) => {
        const page = getPageInfo(unifiedPageNumber)
        if (!page) return null

        const fileUrl = getFileUrl(page.fileId)
        if (!fileUrl) return null

        const fileInfo = getFileInfo(page.fileId)
        if (!fileInfo) return null
        const isDeleted = deletedPages.has(unifiedPageNumber)
        const rotation = pageRotations[unifiedPageNumber] || 0
        const hasRotation = rotation !== 0
        const finalPageNumber = getFinalPageNumber(unifiedPageNumber)

        const actions = [
          // Reorder buttons
          {
            icon: <ChevronUpIcon className="h-4 w-4" />,
            onClick: () => handleMoveUp(index),
            ariaLabel: `Move page ${unifiedPageNumber} up`,
            title: index === 0 ? "Already at top" : "Move up",
            disabled: index === 0 || isProcessing,
            className: "sm:hidden",
          },
          {
            icon: <ChevronDownIcon className="h-4 w-4" />,
            onClick: () => handleMoveDown(index),
            ariaLabel: `Move page ${unifiedPageNumber} down`,
            title: index === pageOrder.length - 1 ? "Already at bottom" : "Move down",
            disabled: index === pageOrder.length - 1 || isProcessing,
            className: "sm:hidden",
          },
          {
            icon: <ChevronLeftIcon className="h-4 w-4" />,
            onClick: () => handleMoveLeft(index),
            ariaLabel: `Move page ${unifiedPageNumber} left`,
            title: index === 0 ? "Already at start" : "Move left",
            disabled: index === 0 || isProcessing,
            className: "hidden sm:flex",
          },
          {
            icon: <ChevronRightIcon className="h-4 w-4" />,
            onClick: () => handleMoveRight(index),
            ariaLabel: `Move page ${unifiedPageNumber} right`,
            title: index === pageOrder.length - 1 ? "Already at end" : "Move right",
            disabled: index === pageOrder.length - 1 || isProcessing,
            className: "hidden sm:flex",
          },
          // Delete button
          {
            icon: isDeleted ? <RefreshCw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />,
            onClick: () => onToggleDelete(unifiedPageNumber),
            ariaLabel: isDeleted ? `Restore page ${unifiedPageNumber}` : `Delete page ${unifiedPageNumber}`,
            title: isDeleted ? "Restore" : "Delete",
            disabled: isProcessing,
            variant: (isDeleted ? "destructive" : "secondary") as "destructive" | "secondary",
          },
          // Rotate buttons
          {
            icon: <RotateCw className="h-4 w-4" />,
            onClick: () => onRotate(unifiedPageNumber, ROTATION_ANGLES.INCREMENT),
            ariaLabel: `Rotate page ${unifiedPageNumber} 90° clockwise`,
            title: "Rotate 90° clockwise",
            disabled: isProcessing,
          },
          {
            icon: <RotateCcw className="h-4 w-4" />,
            onClick: () => onRotate(unifiedPageNumber, -ROTATION_ANGLES.INCREMENT),
            ariaLabel: `Rotate page ${unifiedPageNumber} 90° counter-clockwise`,
            title: "Rotate 90° counter-clockwise",
            disabled: isProcessing,
          },
          // Reset rotation button (only show if rotated)
          ...(hasRotation
            ? [
                {
                  icon: <RefreshCw className="h-4 w-4" />,
                  onClick: () => onResetRotation(unifiedPageNumber),
                  ariaLabel: `Reset rotation for page ${unifiedPageNumber}`,
                  title: "Reset rotation",
                  disabled: isProcessing,
                  variant: "destructive" as const,
                },
              ]
            : []),
          // Extract button
          {
            icon: <Download className="h-4 w-4" />,
            onClick: () => onExtract(unifiedPageNumber),
            ariaLabel: `Extract page ${unifiedPageNumber} as single PDF`,
            title: "Extract as single PDF",
            disabled: isProcessing,
          },
        ]

        const containerStyle = fileInfo?.color 
          ? { 
              backgroundColor: addOklchAlpha(fileInfo.color, 0.15)
            } 
          : undefined

        const pageDescriptionId = `page-${unifiedPageNumber}-description`
        const pageLabel = `Page ${unifiedPageNumber}${fileInfo.file.name ? ` from ${fileInfo.file.name}` : ''}${isDeleted ? ' (deleted)' : ''}${hasRotation ? ` (rotated ${rotation}°)` : ''}`

        return (
          <article
            key={`${page.id}-${index}`}
            draggable
            role="button"
            tabIndex={0}
            aria-label={pageLabel}
            aria-describedby={pageDescriptionId}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onKeyDown={(e) => {
              // Keyboard navigation for drag and drop
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                // Focus management for keyboard users
                if (e.key === 'Enter') {
                  // Could trigger a context menu or action panel
                }
              }
            }}
            className={cn(
              "relative group border border-border p-4 transition-all flex gap-4",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              draggedIndex === index && "opacity-50",
              dragOverIndex === index && "ring-2 ring-primary ring-offset-2",
              isDeleted && "opacity-50"
            )}
            style={containerStyle}
          >
            <div className="flex-1 min-w-0">
              <PdfPageThumbnail
                fileUrl={fileUrl}
                pageNumber={page.originalPageNumber}
                rotation={rotation}
                pdfColor={fileInfo.color}
                pdfFileName={fileInfo.file.name}
                finalPageNumber={finalPageNumber}
                fileType={fileInfo.type}
                totalPages={pageOrder.length}
              />
              <div id={pageDescriptionId} className="sr-only">
                {`Page ${page.originalPageNumber} of ${fileInfo.file.name}. ${isDeleted ? 'Marked for deletion. ' : ''}${hasRotation ? `Rotated ${rotation} degrees. ` : ''}${finalPageNumber !== null ? `Will be page ${finalPageNumber} in final PDF.` : ''}`}
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-1" aria-hidden="true">
                {isDeleted && (
                  <Badge variant="destructive" className="text-xs">
                    Deleted
                  </Badge>
                )}
                {hasRotation && (
                  <Badge variant="default" className="text-xs">
                    {rotation}°
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              <PdfActionButtons actions={actions} showGrip={true} />
            </div>
          </article>
        )
      })}
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
// Custom comparison function to optimize re-renders
export const PdfPageGrid = React.memo(PdfPageGridComponent, (prevProps, nextProps) => {
  // Compare primitive values
  if (
    prevProps.isProcessing !== nextProps.isProcessing ||
    prevProps.columns !== nextProps.columns ||
    prevProps.pageOrder.length !== nextProps.pageOrder.length ||
    prevProps.pdfFiles.length !== nextProps.pdfFiles.length ||
    prevProps.unifiedPages.length !== nextProps.unifiedPages.length ||
    prevProps.deletedPages.size !== nextProps.deletedPages.size ||
    Object.keys(prevProps.pageRotations).length !== Object.keys(nextProps.pageRotations).length
  ) {
    return false // Props changed, re-render
  }

  // Deep comparison for arrays and objects (shallow check is usually sufficient)
  // If order changed, we need to re-render
  if (prevProps.pageOrder.some((val, idx) => val !== nextProps.pageOrder[idx])) {
    return false
  }

  // Check if deleted pages changed (optimized: check size first, then iterate once)
  if (prevProps.deletedPages.size !== nextProps.deletedPages.size) {
    return false
  }
  for (const pageNum of prevProps.deletedPages) {
    if (!nextProps.deletedPages.has(pageNum)) {
      return false
    }
  }

  // Check if rotations changed
  const prevRotationKeys = Object.keys(prevProps.pageRotations)
  const nextRotationKeys = Object.keys(nextProps.pageRotations)
  if (prevRotationKeys.length !== nextRotationKeys.length) {
    return false
  }
  for (const key of prevRotationKeys) {
    if (prevProps.pageRotations[Number(key)] !== nextProps.pageRotations[Number(key)]) {
      return false
    }
  }

  // Functions are compared by reference - if they're stable, this is fine
  // If they changed, we want to re-render anyway
  return (
    prevProps.onReorder === nextProps.onReorder &&
    prevProps.onToggleDelete === nextProps.onToggleDelete &&
    prevProps.onRotate === nextProps.onRotate &&
    prevProps.onResetRotation === nextProps.onResetRotation &&
    prevProps.onExtract === nextProps.onExtract &&
    prevProps.pdfFiles === nextProps.pdfFiles &&
    prevProps.unifiedPages === nextProps.unifiedPages
  )
})


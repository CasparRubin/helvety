"use client"

import * as React from "react"
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

import { PdfPageThumbnail } from "@/components/pdf-page-thumbnail"
import { PdfActionButtons } from "@/components/pdf-action-buttons"
import { Badge } from "@/components/ui/badge"

import { cn } from "@/lib/utils"
import { addOklchAlpha } from "@/lib/pdf-colors"
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

export function PdfPageGrid({
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
}: PdfPageGridProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
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
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...pageOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp
    onReorder(newOrder)
  }

  const handleMoveDown = (index: number) => {
    if (index === pageOrder.length - 1) return
    const newOrder = [...pageOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index + 1]
    newOrder[index + 1] = temp
    onReorder(newOrder)
  }

  const handleMoveLeft = (index: number) => {
    handleMoveUp(index)
  }

  const handleMoveRight = (index: number) => {
    handleMoveDown(index)
  }

  // Get page info for display
  const getPageInfo = (unifiedPageNumber: number) => {
    return unifiedPages.find(p => p.unifiedPageNumber === unifiedPageNumber)
  }

  const getFileUrl = (fileId: string) => {
    return pdfFiles.find(f => f.id === fileId)?.url
  }

  const getFileInfo = (fileId: string) => {
    return pdfFiles.find(f => f.id === fileId)
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
    <div className={gridClassName} style={gridStyle}>
      {pageOrder.map((unifiedPageNumber, index) => {
        const page = getPageInfo(unifiedPageNumber)
        if (!page) return null

        const fileUrl = getFileUrl(page.fileId)
        if (!fileUrl) return null

        const fileInfo = getFileInfo(page.fileId)
        const isDeleted = deletedPages.has(unifiedPageNumber)
        const rotation = pageRotations[unifiedPageNumber] || 0
        const hasRotation = rotation !== 0
        
        // Calculate final page number (position in final PDF, excluding deleted pages)
        const finalPageNumber = isDeleted 
          ? null 
          : pageOrder.slice(0, index + 1).filter(p => !deletedPages.has(p)).length

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
            variant: isDeleted ? "destructive" : "secondary",
          },
          // Rotate buttons
          {
            icon: <RotateCw className="h-4 w-4" />,
            onClick: () => onRotate(unifiedPageNumber, 90),
            ariaLabel: `Rotate page ${unifiedPageNumber} 90° clockwise`,
            title: "Rotate 90° clockwise",
            disabled: isProcessing,
          },
          {
            icon: <RotateCcw className="h-4 w-4" />,
            onClick: () => onRotate(unifiedPageNumber, -90),
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

        return (
          <div
            key={`${page.id}-${index}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative group border border-border p-4 transition-all flex gap-4",
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
                pdfColor={fileInfo?.color}
                pdfFileName={fileInfo?.file.name}
                finalPageNumber={finalPageNumber}
              />
              <div className="mt-2 flex flex-wrap justify-center gap-1">
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
          </div>
        )
      })}
    </div>
  )
}


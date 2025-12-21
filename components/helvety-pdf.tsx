"use client"

import * as React from "react"
import { PDFDocument, degrees } from "pdf-lib"
import { Upload, Download, Loader2, AlertCircle, X } from "lucide-react"

import { PdfPageGrid } from "@/components/pdf-page-grid"
import { PdfToolkit } from "@/components/pdf-toolkit"
import { Button } from "@/components/ui/button"

import { cn, formatTimestamp } from "@/lib/utils"
import { getPdfColor } from "@/lib/pdf-colors"
import type { PdfFile, UnifiedPage } from "@/lib/types"

// Timeout constants (in milliseconds)
const BLOB_URL_CLEANUP_DELAY = 100
const ERROR_AUTO_DISMISS_DELAY = 8000

export function HelvetyPdf() {
  const [pdfFiles, setPdfFiles] = React.useState<PdfFile[]>([])
  const [unifiedPages, setUnifiedPages] = React.useState<UnifiedPage[]>([])
  const [pageOrder, setPageOrder] = React.useState<number[]>([]) // Array of unified page numbers in current order
  const [deletedPages, setDeletedPages] = React.useState<Set<number>>(new Set()) // Set of unified page numbers
  const [pageRotations, setPageRotations] = React.useState<Record<number, number>>({}) // unifiedPageNumber -> rotation angle
  const [isDragging, setIsDragging] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [columns, setColumns] = React.useState<number | undefined>(undefined)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const errorTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

  // Get default column count based on screen size
  const getDefaultColumns = (): number => {
    if (typeof window === "undefined") return 2
    const width = window.innerWidth
    if (width >= 1655) return 3
    if (width >= 1231) return 2
    return 1
  }

  // Initialize columns from localStorage or default based on screen size
  React.useEffect(() => {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem("helvety-pdf-columns")
    if (stored) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed) && parsed >= 2 && parsed <= 10) {
        setColumns(parsed)
        return
      }
    }

    // No stored value, use default based on screen size
    setColumns(getDefaultColumns())
  }, [])

  // Handle window resize to update default if no localStorage value exists
  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handleResize = () => {
      const stored = localStorage.getItem("helvety-pdf-columns")
      if (!stored) {
        // Only update if no stored value exists
        setColumns(getDefaultColumns())
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Handle column change and persist to localStorage
  const handleColumnsChange = (newColumns: number) => {
    setColumns(newColumns)
    if (typeof window !== "undefined") {
      localStorage.setItem("helvety-pdf-columns", newColumns.toString())
    }
  }

  // Normalize rotation angle to 0, 90, 180, or 270
  const normalizeRotation = (angle: number): number => {
    let normalized = angle % 360
    if (normalized < 0) normalized += 360
    return Math.round(normalized / 90) * 90 % 360
  }

  // Create unified pages array from PDF files
  const createUnifiedPages = React.useCallback((files: PdfFile[]): UnifiedPage[] => {
    const pages: UnifiedPage[] = []
    let unifiedNumber = 1

    for (const file of files) {
      for (let i = 1; i <= file.pageCount; i++) {
        pages.push({
          id: `${file.id}-page-${i}`,
          fileId: file.id,
          originalPageNumber: i,
          unifiedPageNumber: unifiedNumber++,
        })
      }
    }

    return pages
  }, [])

  // Update unified pages when files change
  React.useEffect(() => {
    if (pdfFiles.length > 0) {
      const newUnifiedPages = createUnifiedPages(pdfFiles)
      setUnifiedPages(newUnifiedPages)
      // Initialize page order as sequential
      setPageOrder(newUnifiedPages.map(p => p.unifiedPageNumber))
    } else {
      setUnifiedPages([])
      setPageOrder([])
    }
  }, [pdfFiles, createUnifiedPages])

  const validateAndAddFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const pdfFilesToAdd: PdfFile[] = []
    const validationErrors: string[] = []

    for (const file of fileArray) {
      if (file.type !== "application/pdf") {
        validationErrors.push(`'${file.name}' is not a PDF file.`)
        continue
      }

      if (pdfFiles.some((pf) => pf.file.name === file.name && pf.file.size === file.size)) {
        validationErrors.push(`'${file.name}' is already added.`)
        continue
      }

      try {
        const blob = new Blob([file], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const count = pdf.getPageCount()

        if (count === 0) {
          validationErrors.push(`'${file.name}' has no pages.`)
          URL.revokeObjectURL(url)
          continue
        }

        // Assign color based on current file count
        const color = getPdfColor(pdfFiles.length + pdfFilesToAdd.length)

        pdfFilesToAdd.push({
          id: generateId(),
          file,
          url,
          pageCount: count,
          color,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message.toLowerCase() : ""
        let userMessage = `Can't load '${file.name}':`
        
        if (errorMessage.includes("password") || errorMessage.includes("encrypted")) {
          userMessage += " password-protected. Remove password and try again."
        } else if (errorMessage.includes("corrupt") || errorMessage.includes("invalid")) {
          userMessage += " file may be corrupted. Try a different file."
        } else {
          userMessage += " file may be corrupted or password-protected."
        }
        
        validationErrors.push(userMessage)
      }
    }

    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.length === 1 
        ? validationErrors[0]
        : `Some files couldn't be added:\n${validationErrors.map((err, idx) => `${idx + 1}. ${err}`).join('\n')}`
      setError(errorMessage)
    }

    if (pdfFilesToAdd.length > 0) {
      setPdfFiles((prev) => [...prev, ...pdfFilesToAdd])
      if (validationErrors.length === 0) {
        setError(null)
      }
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      validateAndAddFiles(files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      validateAndAddFiles(files)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveFile = (fileId: string) => {
    const file = pdfFiles.find(f => f.id === fileId)
    if (file) {
      URL.revokeObjectURL(file.url)
    }
    setPdfFiles((prev) => prev.filter((f) => f.id !== fileId))
    // Reset all page-related state when files change
    setDeletedPages(new Set())
    setPageRotations({})
    setError(null)
  }

  const handleClearAll = () => {
    // Clean up all blob URLs
    pdfFiles.forEach(file => {
      URL.revokeObjectURL(file.url)
    })
    setPdfFiles([])
    setUnifiedPages([])
    setPageOrder([])
    setDeletedPages(new Set())
    setPageRotations({})
    setError(null)
  }

  const handleToggleDelete = (unifiedPageNumber: number) => {
    setDeletedPages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(unifiedPageNumber)) {
        newSet.delete(unifiedPageNumber)
      } else {
        // Prevent deleting all pages
        const totalPages = pageOrder.length
        const deletedCount = newSet.size
        if (totalPages - deletedCount <= 1) {
          setError("Cannot delete all pages. At least one page must remain.")
          return prev
        }
        newSet.add(unifiedPageNumber)
      }
      return newSet
    })
    setError(null)
  }

  const handleRotatePage = (unifiedPageNumber: number, angle: number) => {
    setPageRotations((prev) => {
      const currentRotation = prev[unifiedPageNumber] || 0
      const newRotation = normalizeRotation(currentRotation + angle)
      return {
        ...prev,
        [unifiedPageNumber]: newRotation,
      }
    })
    setError(null)
  }

  const handleResetRotation = (unifiedPageNumber: number) => {
    setPageRotations((prev) => {
      const newRotations = { ...prev }
      delete newRotations[unifiedPageNumber]
      return newRotations
    })
    setError(null)
  }

  const handleExtractPage = async (unifiedPageNumber: number) => {
    if (pdfFiles.length === 0 || unifiedPages.length === 0) {
      setError("No PDF files loaded.")
      return
    }

    const page = unifiedPages.find(p => p.unifiedPageNumber === unifiedPageNumber)
    if (!page) return

    const file = pdfFiles.find(f => f.id === page.fileId)
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const arrayBuffer = await file.file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const newPdf = await PDFDocument.create()

      const pageIndex = page.originalPageNumber - 1
      const [copiedPage] = await newPdf.copyPages(pdf, [pageIndex])
      newPdf.addPage(copiedPage)

      // Apply rotation if user has rotated this page
      // Combine original page rotation with user-applied rotation
      const rotation = pageRotations[unifiedPageNumber] || 0
      if (rotation !== 0) {
        const newPage = newPdf.getPage(0)
        try {
          // Get original page rotation and combine with user rotation
          const originalPage = pdf.getPage(pageIndex)
          const rotationObj = originalPage.getRotation()
          const originalRotation = (rotationObj !== null && typeof rotationObj === 'object' && 'angle' in rotationObj) 
            ? rotationObj.angle 
            : (typeof rotationObj === 'number' ? rotationObj : 0)
          const totalRotation = normalizeRotation(originalRotation + rotation)
          newPage.setRotation(degrees(totalRotation))
        } catch {
          // If we can't read original rotation, just apply user rotation
          newPage.setRotation(degrees(rotation))
        }
      }

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })

      const baseName = file.file.name.replace(/\.pdf$/i, "")
      const dateStr = formatTimestamp()
      const filename = `${baseName}_page${page.originalPageNumber}_${dateStr}.pdf`

      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = filename
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, BLOB_URL_CLEANUP_DELAY)

      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message.toLowerCase() : ""
      let userMessage = `Can't extract page:`
      
      if (errorMessage.includes("password") || errorMessage.includes("encrypted")) {
        userMessage += " password-protected. Remove password and try again."
      } else if (errorMessage.includes("corrupt") || errorMessage.includes("invalid")) {
        userMessage += " file may be corrupted. Try a different file."
      } else {
        userMessage += " file may be corrupted or password-protected."
      }
      
      setError(userMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (pdfFiles.length === 0 || unifiedPages.length === 0) {
      setError("Add at least one PDF file to download.")
      return
    }

    const activePages = pageOrder.filter(pageNum => !deletedPages.has(pageNum))
    if (activePages.length === 0) {
      setError("Cannot download. All pages are deleted. At least one page must remain.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create single merged PDF
      const mergedPdf = await PDFDocument.create()

      for (const unifiedPageNum of activePages) {
        const page = unifiedPages.find(p => p.unifiedPageNumber === unifiedPageNum)
        if (!page) continue

        const file = pdfFiles.find(f => f.id === page.fileId)
        if (!file) continue

        try {
          const arrayBuffer = await file.file.arrayBuffer()
          const pdf = await PDFDocument.load(arrayBuffer)
          const pageIndex = page.originalPageNumber - 1
          const [copiedPage] = await mergedPdf.copyPages(pdf, [pageIndex])
          mergedPdf.addPage(copiedPage)

          // Apply rotation if user has rotated this page
          // Combine original page rotation with user-applied rotation
          const rotation = pageRotations[unifiedPageNum] || 0
          if (rotation !== 0) {
            const newPage = mergedPdf.getPage(mergedPdf.getPageCount() - 1)
            try {
              // Get original page rotation and combine with user rotation
              const originalPage = pdf.getPage(pageIndex)
              const rotationObj = originalPage.getRotation()
              const originalRotation = (rotationObj !== null && typeof rotationObj === 'object' && 'angle' in rotationObj) 
                ? rotationObj.angle 
                : (typeof rotationObj === 'number' ? rotationObj : 0)
              const totalRotation = normalizeRotation(originalRotation + rotation)
              newPage.setRotation(degrees(totalRotation))
            } catch {
              // If we can't read original rotation, just apply user rotation
              newPage.setRotation(degrees(rotation))
            }
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message.toLowerCase() : ""
          let userMessage = `Can't process page from '${file.file.name}':`
          
          if (errorMessage.includes("password") || errorMessage.includes("encrypted")) {
            userMessage += " password-protected. Remove password and try again."
          } else if (errorMessage.includes("corrupt") || errorMessage.includes("invalid")) {
            userMessage += " file may be corrupted. Try a different file."
          } else {
            userMessage += " file may be corrupted or password-protected."
          }
          
          throw new Error(userMessage)
        }
      }

      const pdfBytes = await mergedPdf.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })

      const dateStr = formatTimestamp()
      const filename = `helvety-pdf_${dateStr}.pdf`

      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = filename
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, BLOB_URL_CLEANUP_DELAY)

      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Download failed. Check that all files are valid PDFs and try again."
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDismissError = () => {
    setError(null)
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = null
    }
  }

  // Auto-dismiss non-critical errors after a delay
  // Critical errors (file loading/processing failures) remain visible until dismissed
  React.useEffect(() => {
    if (error && !isProcessing) {
      const isCriticalError = error.includes("Can't process") || error.includes("Can't load") || error.includes("Can't extract") || error.includes("Download failed")
      
      if (!isCriticalError) {
        errorTimeoutRef.current = setTimeout(() => {
          setError(null)
        }, ERROR_AUTO_DISMISS_DELAY)
      }

      return () => {
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current)
        }
      }
    }
  }, [error, isProcessing])

  return (
    <div 
      className={cn(
        "w-full min-h-screen py-4 md:py-6 lg:py-8",
        "flex flex-col lg:flex-row gap-6",
        "container mx-auto px-4"
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Main Canvas Area */}
      <div className={cn(
        "flex-1 w-full",
        "relative"
      )}>
        {/* Unified Drag and Drop Zone / Canvas */}
        <div
          className={cn(
            "relative w-full min-h-[400px] transition-colors",
            isDragging
              ? "border-2 border-dashed border-primary bg-primary/5"
              : pdfFiles.length === 0
              ? "border-2 border-dashed border-border"
              : "border-0"
          )}
        >
          {/* Empty State - Drag and Drop Zone */}
          {pdfFiles.length === 0 && (
            <div className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-4 p-12",
              "pointer-events-none"
            )}>
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Drag and drop PDF files here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the panel on the right to add files
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PDF Pages Grid */}
          {pdfFiles.length > 0 && unifiedPages.length > 0 && (
            <PdfPageGrid
              pdfFiles={pdfFiles}
              unifiedPages={unifiedPages}
              pageOrder={pageOrder}
              deletedPages={deletedPages}
              pageRotations={pageRotations}
              onReorder={setPageOrder}
              onToggleDelete={handleToggleDelete}
              onRotate={handleRotatePage}
              onResetRotation={handleResetRotation}
              onExtract={handleExtractPage}
              isProcessing={isProcessing}
              columns={columns}
            />
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div 
            role="alert"
            className="mt-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              {error.includes('\n') ? (
                <div className="whitespace-pre-line">{error}</div>
              ) : (
                <p>{error}</p>
              )}
            </div>
            <button
              onClick={handleDismissError}
              className="flex-shrink-0 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-opacity"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>

      {/* Toolkit Panel - Always Visible */}
      <PdfToolkit
        pdfFiles={pdfFiles}
        totalPages={pageOrder.length}
        deletedCount={pageOrder.filter(p => deletedPages.has(p)).length}
        rotatedCount={Object.keys(pageRotations).filter(k => pageRotations[Number(k)] !== 0).length}
        onDownload={handleDownload}
        onClearAll={handleClearAll}
        onRemoveFile={handleRemoveFile}
        onAddFiles={() => fileInputRef.current?.click()}
        isProcessing={isProcessing}
        columns={columns}
        onColumnsChange={handleColumnsChange}
      />
    </div>
  )
}


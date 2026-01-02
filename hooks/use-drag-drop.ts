import * as React from "react"

interface UseDragDropReturn {
  isDragging: boolean
  handleDragEnter: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent, onFilesDropped: (files: FileList) => void) => void
}

/**
 * Custom hook for managing drag and drop state and handlers.
 * 
 * @returns Object containing drag state and event handlers
 */
export function useDragDrop(): UseDragDropReturn {
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDragEnter = React.useCallback((e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = React.useCallback((e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = React.useCallback((e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = React.useCallback((e: React.DragEvent, onFilesDropped: (files: FileList) => void): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFilesDropped(files)
    }
  }, [])

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  }
}


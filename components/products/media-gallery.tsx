'use client'

/**
 * Media gallery component
 * Displays screenshots and screencaptures in a scrollable gallery with lightbox
 */

import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react'
import Image from 'next/image'
import { useState, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import type { MediaItem } from '@/lib/types/products'

interface MediaGalleryProps {
  items: MediaItem[]
  className?: string
}

export function MediaGallery({ items, className }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  // Filter out failed images
  const validItems = items.filter((item) => !failedImages.has(item.src))

  const handleImageError = useCallback((src: string) => {
    setFailedImages((prev) => new Set(prev).add(src))
  }, [])

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < validItems.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious()
    } else if (e.key === 'ArrowRight') {
      goToNext()
    } else if (e.key === 'Escape') {
      closeLightbox()
    }
  }

  if (validItems.length === 0) {
    return null
  }

  return (
    <>
      {/* Gallery Grid */}
      <div
        className={cn(
          'grid gap-4',
          validItems.length === 1 && 'grid-cols-1',
          validItems.length === 2 && 'grid-cols-1 sm:grid-cols-2',
          validItems.length >= 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          className
        )}
      >
        {validItems.map((item, index) => (
          <MediaThumbnail
            key={item.src}
            item={item}
            onClick={() => openLightbox(index)}
            onError={() => handleImageError(item.src)}
          />
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-background/95 backdrop-blur"
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">
            {selectedIndex !== null ? validItems[selectedIndex]?.alt : 'Image preview'}
          </DialogTitle>
          
          {selectedIndex !== null && validItems[selectedIndex] && (
            <div className="relative flex items-center justify-center min-h-[50vh]">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={closeLightbox}
              >
                <X className="size-5" />
              </Button>

              {/* Previous button */}
              {selectedIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="size-6" />
                </Button>
              )}

              {/* Image */}
              <div className="relative w-full h-full flex items-center justify-center p-4">
                {validItems[selectedIndex].type === 'gif' ? (
                  // Use regular img for GIFs to preserve animation
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={validItems[selectedIndex].src}
                    alt={validItems[selectedIndex].alt}
                    className="max-w-full max-h-[85vh] object-contain rounded-lg"
                  />
                ) : (
                  <Image
                    src={validItems[selectedIndex].src}
                    alt={validItems[selectedIndex].alt}
                    width={1920}
                    height={1080}
                    className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg"
                    unoptimized
                  />
                )}
              </div>

              {/* Next button */}
              {selectedIndex < validItems.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                  onClick={goToNext}
                >
                  <ChevronRight className="size-6" />
                </Button>
              )}

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
                {selectedIndex + 1} / {validItems.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

interface MediaThumbnailProps {
  item: MediaItem
  onClick: () => void
  onError: () => void
}

function MediaThumbnail({ item, onClick, onError }: MediaThumbnailProps) {
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    setHasError(true)
    onError()
  }

  if (hasError) {
    return null
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-video overflow-hidden rounded-lg border bg-muted transition-all hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {item.type === 'gif' ? (
        // Use regular img for GIFs to preserve animation
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          alt={item.alt}
          className="size-full object-cover"
          onError={handleError}
        />
      ) : (
        <Image
          src={item.src}
          alt={item.alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={handleError}
          unoptimized
        />
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
        <Maximize2 className="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* GIF badge */}
      {item.type === 'gif' && (
        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
          GIF
        </span>
      )}
    </button>
  )
}

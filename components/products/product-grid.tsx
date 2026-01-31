/**
 * Product grid component
 * Responsive grid layout for product cards
 */

import { Package } from 'lucide-react'

import { cn } from '@/lib/utils'

import { ProductCard } from './product-card'

import type { Product } from '@/lib/types/products'

interface ProductGridProps {
  products: Product[]
  className?: string
  columns?: 1 | 2 | 3 | 4
}

export function ProductGrid({ products, className, columns = 3 }: ProductGridProps) {
  if (products.length === 0) {
    return <ProductGridEmpty />
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function ProductGridEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Package className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">No products found</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Try adjusting your filters or check back later for new products.
      </p>
    </div>
  )
}

interface ProductGridSkeletonProps {
  count?: number
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function ProductGridSkeleton({
  count = 6,
  columns = 3,
  className,
}: ProductGridSkeletonProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border bg-card p-6 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="size-10 animate-pulse rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

'use client'

/**
 * Command bar component
 * Provides contextual actions below the navbar based on the current page
 */

import { ArrowLeft, Globe, Github, CreditCard } from 'lucide-react'
import Link from 'next/link'

import { ProductFilters, type FilterType } from '@/components/products'
import { SubscriptionsSheet } from '@/components/subscriptions-sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import type { ProductLinks } from '@/lib/types/products'

interface CommandBarBaseProps {
  className?: string
}

interface CatalogCommandBarProps extends CommandBarBaseProps {
  variant: 'catalog'
  filter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts?: Record<FilterType, number>
}

interface ProductDetailCommandBarProps extends CommandBarBaseProps {
  variant: 'product-detail'
  productName: string
  links?: ProductLinks
}

type CommandBarProps = CatalogCommandBarProps | ProductDetailCommandBarProps

export function CommandBar(props: CommandBarProps) {
  return (
    <div
      className={cn(
        'sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        props.className
      )}
    >
      <div className="container mx-auto flex h-12 items-center justify-between px-4">
        {props.variant === 'catalog' ? (
          <CatalogActions
            filter={props.filter}
            onFilterChange={props.onFilterChange}
            counts={props.counts}
          />
        ) : (
          <ProductDetailActions
            productName={props.productName}
            links={props.links}
          />
        )}
      </div>
    </div>
  )
}

interface CatalogActionsProps {
  filter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts?: Record<FilterType, number>
}

function CatalogActions({ filter, onFilterChange, counts }: CatalogActionsProps) {
  return (
    <>
      {/* Left side - Filters */}
      <div className="flex items-center">
        <ProductFilters
          value={filter}
          onChange={onFilterChange}
          counts={counts}
        />
      </div>

      {/* Right side - My Subscriptions */}
      <SubscriptionsSheet
        trigger={
          <Button variant="outline" size="sm">
            <CreditCard className="size-4" />
            <span className="hidden sm:inline">My Subscriptions</span>
          </Button>
        }
      />
    </>
  )
}

interface ProductDetailActionsProps {
  productName: string
  links?: ProductLinks
}

function ProductDetailActions({ productName, links }: ProductDetailActionsProps) {
  const hasLinks = Boolean(links?.website) || Boolean(links?.github)

  return (
    <>
      {/* Left side - Back button */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </Button>
        <Separator orientation="vertical" className="mx-2 h-5" />
        <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px] sm:max-w-none">
          {productName}
        </span>
      </div>

      {/* Right side - Product links */}
      {hasLinks && links && (
        <div className="flex items-center gap-1">
          {links.website && (
            <Button variant="ghost" size="sm" asChild>
              <a href={links.website} target="_blank" rel="noopener noreferrer">
                <Globe className="size-4" />
                <span className="hidden sm:inline">Website</span>
              </a>
            </Button>
          )}
          {links.github && (
            <Button variant="ghost" size="sm" asChild>
              <a href={links.github} target="_blank" rel="noopener noreferrer">
                <Github className="size-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
          )}
        </div>
      )}
    </>
  )
}

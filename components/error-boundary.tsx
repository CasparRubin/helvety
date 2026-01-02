"use client"

import * as React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component to catch and handle React errors gracefully.
 * Provides a fallback UI when errors occur and allows error recovery.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error("ErrorBoundary caught an error:", {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              {this.state.error.message || "An unexpected error occurred. Please try refreshing the page."}
            </p>
          </div>
          <Button onClick={this.resetError} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}


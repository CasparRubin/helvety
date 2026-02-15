/**
 * Error boundary component for PDF page rendering.
 * Catches render-time errors and provides retry functionality.
 */

import * as React from "react";

import { logger } from "@/lib/logger";

/** Props for the PDF page error boundary (children, onError, retryKey). */
interface PageErrorBoundaryProps {
  /** Child components to render */
  readonly children: React.ReactNode;
  /** Callback when error occurs */
  readonly onError: () => void;
  /** Key to force retry by changing */
  readonly retryKey: number;
}

/** Internal state for the PDF page error boundary (hasError flag). */
interface PageErrorBoundaryState {
  /** Whether an error has occurred */
  readonly hasError: boolean;
}

/**
 * Error boundary component to catch render-time errors in PDF pages.
 * Handles PDF.js worker message handler errors and provides retry capability.
 */
export class PageErrorBoundary extends React.Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): PageErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const errorMessage = error?.message || String(error);
    logger.error("PageErrorBoundary caught an error:", {
      error,
      errorInfo,
      errorMessage,
      componentStack: errorInfo.componentStack,
    });

    // Trigger retry for PDF.js worker message handler errors
    if (
      errorMessage.includes("messageHandler") ||
      errorMessage.includes("sendWithPromise")
    ) {
      this.props.onError();
    }
  }

  override componentDidUpdate(prevProps: PageErrorBoundaryProps): void {
    // Reset error state when retry key changes (indicating a retry)
    if (prevProps.retryKey !== this.props.retryKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

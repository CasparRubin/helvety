"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * Navigation Helpers
 *
 * Provides consistent navigation patterns with prefetching and loading states
 * for seamless route transitions.
 */

/**
 * Hook for navigation with prefetching and loading states
 * Provides a consistent pattern for all navigation in the app
 *
 * @returns Object with navigation functions and loading state
 *
 * @example
 * ```tsx
 * const { navigate, prefetch, isPending } = useNavigation()
 *
 * const handleClick = () => {
 *   navigate("/units/123")
 * }
 *
 * const handleMouseEnter = () => {
 *   prefetch("/units/123")
 * }
 * ```
 */
export function useNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /**
   * Prefetch a route for faster navigation
   * Call this on hover or focus for better perceived performance
   *
   * @param href - The route to prefetch
   */
  const prefetch = (href: string) => {
    router.prefetch(href);
  };

  /**
   * Navigate to a route with automatic prefetching
   * Uses startTransition for non-urgent updates to keep UI responsive
   *
   * @param href - The route to navigate to
   * @param options - Optional configuration
   * @param options.immediate
   */
  const navigate = (href: string, options?: { immediate?: boolean }) => {
    // Always prefetch before navigation for better perceived performance
    router.prefetch(href);

    if (options?.immediate) {
      // For urgent navigation (e.g., logout), navigate immediately
      router.push(href);
    } else {
      // For non-urgent navigation, use startTransition to keep UI responsive
      startTransition(() => {
        router.push(href);
      });
    }
  };

  return {
    navigate,
    prefetch,
    isPending,
    router, // Expose router for advanced use cases
  };
}

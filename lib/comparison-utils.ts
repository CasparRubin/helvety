/**
 * Utility functions for comparing data structures.
 * Used for React.memo comparison functions and other equality checks.
 */

/**
 * Checks if two arrays have the same reference or identical content.
 * 
 * @param prev - Previous array
 * @param next - Next array
 * @returns True if arrays are the same reference or have identical content
 * 
 * @example
 * ```typescript
 * const arr1 = [1, 2, 3]
 * const arr2 = [1, 2, 3]
 * areArraysEqual(arr1, arr2) // true
 * areArraysEqual(arr1, arr1) // true (same reference)
 * ```
 */
export function areArraysEqual<T>(prev: ReadonlyArray<T>, next: ReadonlyArray<T>): boolean {
  if (prev === next) return true
  if (prev.length !== next.length) return false
  return !prev.some((val, idx) => val !== next[idx])
}

/**
 * Checks if two Sets are equal.
 * 
 * @param prev - Previous Set
 * @param next - Next Set
 * @returns True if Sets have the same size and all elements match
 * 
 * @example
 * ```typescript
 * const set1 = new Set([1, 2, 3])
 * const set2 = new Set([1, 2, 3])
 * areSetsEqual(set1, set2) // true
 * ```
 */
export function areSetsEqual(prev: ReadonlySet<number>, next: ReadonlySet<number>): boolean {
  if (prev.size !== next.size) return false
  for (const item of prev) {
    if (!next.has(item)) return false
  }
  return true
}

/**
 * Checks if two rotation objects are equal.
 * 
 * @param prev - Previous rotations object
 * @param next - Next rotations object
 * @returns True if rotation objects have identical keys and values
 * 
 * @example
 * ```typescript
 * const rot1 = { 1: 90, 2: 180 }
 * const rot2 = { 1: 90, 2: 180 }
 * areRotationsEqual(rot1, rot2) // true
 * ```
 */
export function areRotationsEqual(
  prev: Readonly<Record<number, number>>,
  next: Readonly<Record<number, number>>
): boolean {
  const prevKeys = Object.keys(prev).map(Number)
  const nextKeys = Object.keys(next).map(Number)
  
  if (prevKeys.length !== nextKeys.length) return false
  
  for (const key of prevKeys) {
    if (prev[key] !== next[key]) return false
  }
  return true
}

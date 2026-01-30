/**
 * Utility functions for comparing data structures.
 * Used for React.memo comparison functions and other equality checks.
 */

/**
 * Compares two arrays of objects by their 'id' property.
 * More efficient than deep comparison when only identity matters.
 * 
 * @param prev - Previous array of objects with id property
 * @param next - Next array of objects with id property
 * @returns True if arrays have same length and all ids match in order
 * 
 * @example
 * ```typescript
 * const files1 = [{ id: 'a', name: 'file1' }, { id: 'b', name: 'file2' }]
 * const files2 = [{ id: 'a', name: 'file1-modified' }, { id: 'b', name: 'file2' }]
 * areArraysEqualById(files1, files2) // true (same ids)
 * ```
 */
export function areArraysEqualById<T extends { id: string }>(
  prev: ReadonlyArray<T>,
  next: ReadonlyArray<T>
): boolean {
  if (prev === next) return true
  if (prev.length !== next.length) return false
  return prev.every((item, i) => item.id === next[i].id)
}

/**
 * Checks if two objects are shallowly equal.
 * Compares all own enumerable properties.
 * 
 * @param prev - Previous object
 * @param next - Next object
 * @returns True if objects have same keys and values (shallow comparison)
 */
export function shallowEqual<T extends Record<string, unknown>>(prev: T, next: T): boolean {
  if (prev === next) return true
  
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)
  
  if (prevKeys.length !== nextKeys.length) return false
  
  return prevKeys.every(key => prev[key] === next[key])
}

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

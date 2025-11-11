/**
 * Array manipulation utilities
 */

/**
 * Remove item from array (immutable)
 *
 * @param arr - Source array
 * @param index - Index to remove
 * @returns New array without item
 */
export function removeAt<T>(arr: T[], index: number): T[] {
  if (index < 0 || index >= arr.length) return arr
  return [...arr.slice(0, index), ...arr.slice(index + 1)]
}

/**
 * Insert item into array (immutable)
 *
 * @param arr - Source array
 * @param index - Index to insert at
 * @param item - Item to insert
 * @returns New array with item inserted
 */
export function insertAt<T>(arr: T[], index: number, item: T): T[] {
  if (index < 0) index = 0
  if (index > arr.length) index = arr.length
  return [...arr.slice(0, index), item, ...arr.slice(index)]
}

/**
 * Move item in array (immutable)
 *
 * @param arr - Source array
 * @param from - From index
 * @param to - To index
 * @returns New array with item moved
 */
export function move<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr
  if (from < 0 || from >= arr.length) return arr
  if (to < 0 || to >= arr.length) return arr

  const item = arr[from]
  const newArr = removeAt(arr, from)
  return insertAt(newArr, to, item)
}

/**
 * Update item in array (immutable)
 *
 * @param arr - Source array
 * @param index - Index to update
 * @param item - New item value
 * @returns New array with item updated
 */
export function updateAt<T>(arr: T[], index: number, item: T): T[] {
  if (index < 0 || index >= arr.length) return arr
  return [...arr.slice(0, index), item, ...arr.slice(index + 1)]
}

/**
 * Chunk array into smaller arrays
 *
 * @param arr - Source array
 * @param size - Chunk size
 * @returns Array of chunks
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

/**
 * Get unique items from array
 *
 * @param arr - Source array
 * @returns Array with unique items
 */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

/**
 * Flatten array one level
 *
 * @param arr - Source array
 * @returns Flattened array
 */
export function flatten<T>(arr: (T | T[])[]): T[] {
  return arr.reduce<T[]>((acc, item) => {
    if (Array.isArray(item)) {
      return acc.concat(item)
    }
    return acc.concat([item])
  }, [])
}

/**
 * Deep flatten array
 *
 * @param arr - Source array
 * @returns Deeply flattened array
 */
export function deepFlatten(arr: any[]): any[] {
  return arr.reduce((acc, item) => {
    if (Array.isArray(item)) {
      return acc.concat(deepFlatten(item))
    }
    return acc.concat([item])
  }, [])
}

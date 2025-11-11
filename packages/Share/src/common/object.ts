/**
 * Object manipulation utilities
 */

import { isPlainObject } from './is'

/**
 * Get value from object by path
 *
 * @param obj - Target object
 * @param path - Path (dot-separated string or array)
 * @param defaultValue - Default value if not found
 * @returns Value at path
 */
export function get(
  obj: any,
  path: string | string[],
  defaultValue?: any
): any {
  if (!obj) return defaultValue

  const keys = Array.isArray(path) ? path : path.split('.')
  let result = obj

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue
    }
    result = result[key]
  }

  return result !== undefined ? result : defaultValue
}

/**
 * Set value in object by path (immutable)
 *
 * @param obj - Target object
 * @param path - Path (dot-separated string or array)
 * @param value - Value to set
 * @returns New object with value set
 */
export function set(obj: any, path: string | string[], value: any): any {
  if (!obj) return obj

  const keys = Array.isArray(path) ? path : path.split('.')
  if (keys.length === 0) return value

  const [first, ...rest] = keys

  if (rest.length === 0) {
    // Last key, set value
    return { ...obj, [first]: value }
  }

  // Recursively set nested value
  return {
    ...obj,
    [first]: set(obj[first] || {}, rest, value)
  }
}

/**
 * Check if object has property
 *
 * @param obj - Target object
 * @param key - Property key
 * @returns True if has property
 */
export function has(obj: any, key: string): boolean {
  return (
    obj !== null &&
    obj !== undefined &&
    Object.prototype.hasOwnProperty.call(obj, key)
  )
}

/**
 * Pick properties from object
 *
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with picked properties
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    if (has(obj, key as string)) {
      result[key] = obj[key]
    }
  })
  return result
}

/**
 * Omit properties from object
 *
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object with omitted properties
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => {
    delete result[key]
  })
  return result
}

/**
 * Deep clone an object
 *
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags) as any
  if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as any

  const cloned = {} as T
  for (const key in obj) {
    if (has(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * Merge objects (shallow)
 *
 * @param target - Target object
 * @param sources - Source objects
 * @returns Merged object
 */
export function merge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  return Object.assign({}, target, ...sources)
}

/**
 * Deep merge objects
 *
 * @param target - Target object
 * @param sources - Source objects
 * @returns Deeply merged object
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target

  const result = { ...target } as any

  sources.forEach((source) => {
    if (!isPlainObject(source)) return

    Object.keys(source).forEach((key) => {
      const sourceValue = (source as any)[key]
      const targetValue = result[key]

      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue)
      } else {
        result[key] = sourceValue
      }
    })
  })

  return result as T
}

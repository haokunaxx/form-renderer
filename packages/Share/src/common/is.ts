/**
 * Type checking utilities
 */

/**
 * Check if value is an object
 */
export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Check if value is a plain object
 */
export function isPlainObject(value: any): value is Record<string, any> {
  if (!isObject(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}

/**
 * Check if value is an array
 */
export function isArray(value: any): value is any[] {
  return Array.isArray(value)
}

/**
 * Check if value is a string
 */
export function isString(value: any): value is string {
  return typeof value === 'string'
}

/**
 * Check if value is a number
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Check if value is a function
 */
export function isFunction(value: any): value is Function {
  return typeof value === 'function'
}

/**
 * Check if value is null
 */
export function isNull(value: any): value is null {
  return value === null
}

/**
 * Check if value is undefined
 */
export function isUndefined(value: any): value is undefined {
  return value === undefined
}

/**
 * Check if value is null or undefined
 */
export function isNil(value: any): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Check if value is a promise
 */
export function isPromise(value: any): value is Promise<any> {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.then === 'function'
  )
}

/**
 * Check if value is a Date
 */
export function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * Check if value is a RegExp
 */
export function isRegExp(value: any): value is RegExp {
  return value instanceof RegExp
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  if (isNil(value)) return true
  if (isString(value)) return value.trim().length === 0
  if (isArray(value)) return value.length === 0
  if (isObject(value)) return Object.keys(value).length === 0
  return false
}

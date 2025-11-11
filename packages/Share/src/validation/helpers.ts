/**
 * Validation helpers
 *
 * Common validation utilities
 */

/**
 * Validation result type
 */
export type ValidationResult = boolean | string | undefined

/**
 * Check if value is empty
 *
 * @param value - Value to check
 * @returns True if empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Required validator
 *
 * @param value - Value to validate
 * @param message - Error message
 * @returns Validation result
 */
export function required(
  value: any,
  message = 'This field is required'
): ValidationResult {
  if (isEmpty(value)) return message
  return true
}

/**
 * Min length validator
 *
 * @param value - Value to validate
 * @param min - Minimum length
 * @param message - Error message
 * @returns Validation result
 */
export function minLength(
  value: any,
  min: number,
  message?: string
): ValidationResult {
  if (isEmpty(value)) return true // Skip if empty

  const length =
    typeof value === 'string' || Array.isArray(value) ? value.length : 0
  if (length < min) {
    return message || `Minimum length is ${min}`
  }
  return true
}

/**
 * Max length validator
 *
 * @param value - Value to validate
 * @param max - Maximum length
 * @param message - Error message
 * @returns Validation result
 */
export function maxLength(
  value: any,
  max: number,
  message?: string
): ValidationResult {
  if (isEmpty(value)) return true // Skip if empty

  const length =
    typeof value === 'string' || Array.isArray(value) ? value.length : 0
  if (length > max) {
    return message || `Maximum length is ${max}`
  }
  return true
}

/**
 * Pattern validator
 *
 * @param value - Value to validate
 * @param pattern - RegExp pattern
 * @param message - Error message
 * @returns Validation result
 */
export function pattern(
  value: any,
  pattern: RegExp,
  message = 'Invalid format'
): ValidationResult {
  if (isEmpty(value)) return true // Skip if empty

  if (typeof value !== 'string') return message
  if (!pattern.test(value)) return message
  return true
}

/**
 * Email validator
 *
 * @param value - Value to validate
 * @param message - Error message
 * @returns Validation result
 */
export function email(
  value: any,
  message = 'Invalid email address'
): ValidationResult {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern(value, emailPattern, message)
}

/**
 * URL validator
 *
 * @param value - Value to validate
 * @param message - Error message
 * @returns Validation result
 */
export function url(value: any, message = 'Invalid URL'): ValidationResult {
  const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
  return pattern(value, urlPattern, message)
}

/**
 * Number range validator
 *
 * @param value - Value to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @param message - Error message
 * @returns Validation result
 */
export function range(
  value: any,
  min: number,
  max: number,
  message?: string
): ValidationResult {
  if (isEmpty(value)) return true // Skip if empty

  const num = typeof value === 'number' ? value : Number(value)
  if (isNaN(num)) return 'Invalid number'

  if (num < min || num > max) {
    return message || `Value must be between ${min} and ${max}`
  }
  return true
}

/**
 * Compose multiple validators
 *
 * @param validators - Array of validator functions
 * @returns Composed validator
 */
export function composeValidators(
  ...validators: Array<(value: any) => ValidationResult>
): (value: any) => ValidationResult {
  return (value: any) => {
    for (const validator of validators) {
      const result = validator(value)
      if (result !== true) return result
    }
    return true
  }
}

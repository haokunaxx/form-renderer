/**
 * Rule converter utilities
 *
 * Helpers for converting Engine validators to UI framework rules
 */

/**
 * Convert validation result to error message
 *
 * @param result - Validation result (boolean, string, or undefined)
 * @returns Error message or null
 */
export function resultToMessage(
  result: boolean | string | undefined
): string | null {
  if (result === true || result === undefined) return null
  if (typeof result === 'string') return result
  return 'Validation failed'
}

/**
 * Check if validation result is success
 *
 * @param result - Validation result
 * @returns True if validation passed
 */
export function isValidationSuccess(
  result: boolean | string | undefined
): boolean {
  return result === true || result === undefined
}

/**
 * Convert Engine validation result to UI framework format
 *
 * @param result - Engine validation result
 * @returns UI framework validation result
 */
export function convertValidationResult(result: any): {
  valid: boolean
  message?: string
} {
  if (result === true || result === undefined) {
    return { valid: true }
  }

  if (typeof result === 'string') {
    return { valid: false, message: result }
  }

  if (typeof result === 'object' && result !== null) {
    if ('ok' in result) {
      // Engine ValidationResult format
      return {
        valid: result.ok === true,
        message: result.errors?.[0]?.message
      }
    }
  }

  return { valid: false, message: 'Validation failed' }
}

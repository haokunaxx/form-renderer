/**
 * String manipulation utilities
 */

/**
 * Capitalize first letter
 *
 * @param str - Input string
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert to camelCase
 *
 * @param str - Input string
 * @returns camelCase string
 */
export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^[A-Z]/, (char) => char.toLowerCase())
}

/**
 * Convert to PascalCase
 *
 * @param str - Input string
 * @returns PascalCase string
 */
export function pascalCase(str: string): string {
  const camel = camelCase(str)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

/**
 * Convert to kebab-case
 *
 * @param str - Input string
 * @returns kebab-case string
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Convert to snake_case
 *
 * @param str - Input string
 * @returns snake_case string
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

/**
 * Truncate string
 *
 * @param str - Input string
 * @param length - Maximum length
 * @param suffix - Suffix to append (default: '...')
 * @returns Truncated string
 */
export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str
  return str.slice(0, length - suffix.length) + suffix
}

/**
 * Pad start of string
 *
 * @param str - Input string
 * @param length - Target length
 * @param char - Padding character (default: ' ')
 * @returns Padded string
 */
export function padStart(str: string, length: number, char = ' '): string {
  if (str.length >= length) return str
  return char.repeat(length - str.length) + str
}

/**
 * Pad end of string
 *
 * @param str - Input string
 * @param length - Target length
 * @param char - Padding character (default: ' ')
 * @returns Padded string
 */
export function padEnd(str: string, length: number, char = ' '): string {
  if (str.length >= length) return str
  return str + char.repeat(length - str.length)
}

/**
 * Template string replacement
 *
 * @param template - Template string with {key} placeholders
 * @param values - Values to replace
 * @returns Interpolated string
 */
export function template(
  template: string,
  values: Record<string, any>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match
  })
}

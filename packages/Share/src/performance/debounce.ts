/* eslint-disable */
/**
 * Debounce utility
 *
 * Creates a debounced function that delays invoking func until after wait milliseconds
 */

/**
 * Debounce function
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @param immediate - Trigger on leading edge instead of trailing
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: any = null

  return function (this: any, ...args: Parameters<T>) {
    const context = this

    const later = () => {
      timeout = null
      if (!immediate) {
        func.apply(context, args)
      }
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) {
      func.apply(context, args)
    }
  }
}

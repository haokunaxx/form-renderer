/* eslint-disable */

/**
 * Throttle utility
 *
 * Creates a throttled function that only invokes func at most once per every wait milliseconds
 */

/**
 * Throttle function
 *
 * @param func - Function to throttle
 * @param wait - Wait time in milliseconds
 * @param options - Throttle options
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  let timeout: any = null
  let previous = 0
  const { leading = true, trailing = true } = options

  return function (this: any, ...args: Parameters<T>) {
    const context = this
    const now = Date.now()

    if (!previous && !leading) {
      previous = now
    }

    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(context, args)
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = !leading ? 0 : Date.now()
        timeout = null
        func.apply(context, args)
      }, remaining)
    }
  }
}

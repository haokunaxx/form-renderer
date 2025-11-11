/**
 * Performance measurement utilities
 */

/**
 * Measure execution time of a function
 *
 * @param name - Measurement name
 * @param fn - Function to measure
 * @returns Function result
 */
export function measure<T>(name: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`)
  return result
}

/**
 * Measure async function execution time
 *
 * @param name - Measurement name
 * @param fn - Async function to measure
 * @returns Promise with function result
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`)
  return result
}

/**
 * Create a performance mark
 *
 * @param name - Mark name
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name)
  }
}

/**
 * Measure performance between two marks
 *
 * @param name - Measure name
 * @param startMark - Start mark name
 * @param endMark - End mark name
 */
export function measureBetween(
  name: string,
  startMark: string,
  endMark: string
): void {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark)
      const measures = performance.getEntriesByName(name, 'measure')
      if (measures.length > 0) {
        const duration = measures[measures.length - 1].duration
        console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`)
      }
    } catch (error) {
      console.warn('[Performance] Failed to measure:', error)
    }
  }
}

/**
 * Batcher - Batch processing utility
 *
 * Collects items and processes them in batches
 */

export class Batcher<T = any> {
  private queue: T[] = []
  private timer: any = null
  private handler: (items: T[]) => void
  private delay: number

  /**
   * Create a batcher
   *
   * @param handler - Function to handle batched items
   * @param delay - Delay in milliseconds before processing (default: 16ms)
   */
  constructor(handler: (items: T[]) => void, delay: number = 16) {
    this.handler = handler
    this.delay = delay
  }

  /**
   * Add an item to the queue
   *
   * @param item - Item to add
   */
  add(item: T): void {
    this.queue.push(item)

    // Schedule flush if not already scheduled
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush()
      }, this.delay)
    }
  }

  /**
   * Flush the queue immediately
   */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.queue.length > 0) {
      const items = this.queue.slice()
      this.queue = []

      try {
        this.handler(items)
      } catch (error) {
        console.error('[Batcher] Error processing batch:', error)
      }
    }
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length
  }

  /**
   * Clear the queue without processing
   */
  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.queue = []
  }

  /**
   * Destroy the batcher
   */
  destroy(): void {
    this.clear()
  }
}

/**
 * Create a batcher
 *
 * @param handler - Function to handle batched items
 * @param delay - Delay in milliseconds
 * @returns Batcher instance
 */
export function createBatcher<T = any>(
  handler: (items: T[]) => void,
  delay?: number
): Batcher<T> {
  return new Batcher(handler, delay)
}

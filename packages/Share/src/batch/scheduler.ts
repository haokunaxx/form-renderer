/**
 * Scheduler - requestAnimationFrame-based scheduler
 *
 * Schedule tasks to run on the next animation frame
 */

export class Scheduler {
  private tasks: Array<() => void> = []
  private rafId: number | null = null

  /**
   * Schedule a task
   *
   * @param task - Task to schedule
   */
  schedule(task: () => void): void {
    this.tasks.push(task)

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flush()
      })
    }
  }

  /**
   * Flush all scheduled tasks
   */
  flush(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    const tasks = this.tasks.slice()
    this.tasks = []

    tasks.forEach((task) => {
      try {
        task()
      } catch (error) {
        console.error('[Scheduler] Error executing task:', error)
      }
    })
  }

  /**
   * Check if there are pending tasks
   */
  hasPendingTasks(): boolean {
    return this.tasks.length > 0
  }

  /**
   * Clear all pending tasks
   */
  clear(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.tasks = []
  }

  /**
   * Destroy the scheduler
   */
  destroy(): void {
    this.clear()
  }
}

/**
 * Create a scheduler
 *
 * @returns Scheduler instance
 */
export function createScheduler(): Scheduler {
  return new Scheduler()
}

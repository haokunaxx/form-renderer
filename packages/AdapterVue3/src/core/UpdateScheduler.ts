import type { FormEngine } from '@form-renderer/engine'

/**
 * 更新调度器
 * 负责批量收集和调度更新，减少不必要的引擎调用和渲染
 */
export class UpdateScheduler {
  private engine: FormEngine
  private pendingUpdates: Map<string, any> = new Map()
  private timer: number | null = null
  private flushCallbacks: Set<() => void> = new Set()

  constructor(engine: FormEngine) {
    this.engine = engine
  }

  /**
   * 调度一个更新
   * 多个连续的更新会被合并为一次批量更新
   */
  scheduleUpdate(path: string, value: any, callback?: () => void): void {
    this.pendingUpdates.set(path, value)

    if (callback) {
      this.flushCallbacks.add(callback)
    }

    if (!this.timer) {
      this.timer = requestAnimationFrame(() => {
        this.flush()
      })
    }
  }

  /**
   * 批量调度多个更新
   */
  scheduleBatch(updates: Record<string, any>, callback?: () => void): void {
    Object.entries(updates).forEach(([path, value]) => {
      this.pendingUpdates.set(path, value)
    })

    if (callback) {
      this.flushCallbacks.add(callback)
    }

    if (!this.timer) {
      this.timer = requestAnimationFrame(() => {
        this.flush()
      })
    }
  }

  /**
   * 立即刷新所有待处理的更新
   */
  flush(): void {
    if (this.timer) {
      cancelAnimationFrame(this.timer)
      this.timer = null
    }

    if (this.pendingUpdates.size === 0) {
      return
    }

    // 批量应用更新
    const updates = Object.fromEntries(this.pendingUpdates)
    this.pendingUpdates.clear()

    try {
      this.engine.updateValue(updates)

      // 执行所有回调
      this.flushCallbacks.forEach((cb) => {
        try {
          cb()
        } catch (error) {
          console.error('Error in flush callback:', error)
        }
      })
    } catch (error) {
      console.error('Error flushing updates:', error)
      throw error
    } finally {
      this.flushCallbacks.clear()
    }
  }

  /**
   * 取消所有待处理的更新
   */
  cancel(): void {
    if (this.timer) {
      cancelAnimationFrame(this.timer)
      this.timer = null
    }

    this.pendingUpdates.clear()
    this.flushCallbacks.clear()
  }

  /**
   * 检查是否有待处理的更新
   */
  hasPending(): boolean {
    return this.pendingUpdates.size > 0
  }

  /**
   * 获取待处理更新的数量
   */
  getPendingCount(): number {
    return this.pendingUpdates.size
  }

  /**
   * 获取待处理的更新路径列表
   */
  getPendingPaths(): string[] {
    return Array.from(this.pendingUpdates.keys())
  }

  /**
   * 销毁调度器
   */
  destroy(): void {
    this.cancel()
  }
}

/**
 * 创建更新调度器实例
 */
export function createUpdateScheduler(engine: FormEngine): UpdateScheduler {
  return new UpdateScheduler(engine)
}

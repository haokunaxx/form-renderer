/**
 * 批量更新工具函数
 */

import type { UpdateItem } from '../types'

/**
 * 批量更新管理器
 */
export class BatchUpdateManager {
  private pending = new Map<string, any>()
  private timer: number | null = null
  private flushCallback: (updates: UpdateItem[]) => void

  constructor(flushCallback: (updates: UpdateItem[]) => void) {
    this.flushCallback = flushCallback
  }

  /**
   * 调度更新
   * @param path 路径
   * @param value 值
   */
  scheduleUpdate(path: string, value: any): void {
    this.pending.set(path, value)

    if (!this.timer) {
      this.timer = requestAnimationFrame(() => {
        this.flush()
      })
    }
  }

  /**
   * 立即执行所有更新
   */
  flush(): void {
    if (this.pending.size === 0) return

    const updates = Array.from(this.pending.entries()).map(([path, value]) => ({
      path,
      value
    }))

    this.pending.clear()
    this.timer = null

    this.flushCallback(updates)
  }

  /**
   * 清空待处理的更新
   */
  clear(): void {
    if (this.timer !== null) {
      cancelAnimationFrame(this.timer)
      this.timer = null
    }
    this.pending.clear()
  }

  /**
   * 是否有待处理的更新
   */
  hasPending(): boolean {
    return this.pending.size > 0
  }

  /**
   * 获取待处理的更新数量
   */
  getPendingCount(): number {
    return this.pending.size
  }
}

/**
 * 创建批量更新函数
 * @param handler 处理函数
 * @returns 批量更新函数
 */
export function createBatchUpdate<T extends any[]>(
  handler: (...args: T) => void
): (...args: T) => void {
  let updates: T[] = []
  let timer: number | null = null

  return (...args: T) => {
    updates.push(args)

    if (!timer) {
      timer = requestAnimationFrame(() => {
        const batch = [...updates]
        updates = []
        timer = null

        // 批量执行
        batch.forEach((args) => handler(...args))
      })
    }
  }
}

/**
 * 合并更新项
 * @param updates 更新项数组
 * @returns 合并后的更新项（相同路径取最后一个）
 */
export function mergeUpdates(updates: UpdateItem[]): UpdateItem[] {
  const map = new Map<string, any>()

  for (const update of updates) {
    map.set(update.path, update.value)
  }

  return Array.from(map.entries()).map(([path, value]) => ({
    path,
    value
  }))
}

/**
 * 按路径分组更新项
 * @param updates 更新项
 * @returns 分组后的更新项
 */
export function groupUpdatesByPath(
  updates: UpdateItem[]
): Map<string, UpdateItem[]> {
  const groups = new Map<string, UpdateItem[]>()

  for (const update of updates) {
    const rootPath = update.path.split('.')[0]
    if (!groups.has(rootPath)) {
      groups.set(rootPath, [])
    }
    groups.get(rootPath)!.push(update)
  }

  return groups
}

/**
 * 创建更新队列
 * @param options 选项
 * @returns 更新队列
 */
export function createUpdateQueue(options: {
  maxSize?: number
  flushDelay?: number
  onFlush: (updates: UpdateItem[]) => void
}) {
  const { maxSize = 100, flushDelay = 16, onFlush } = options
  const queue: UpdateItem[] = []
  let timer: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    if (queue.length === 0) return

    const updates = [...queue]
    queue.length = 0
    timer = null

    onFlush(mergeUpdates(updates))
  }

  const scheduleFlush = () => {
    if (!timer) {
      timer = setTimeout(flush, flushDelay)
    }
  }

  return {
    /**
     * 添加更新
     */
    add(update: UpdateItem): void {
      queue.push(update)

      if (queue.length >= maxSize) {
        flush()
      } else {
        scheduleFlush()
      }
    },

    /**
     * 立即执行
     */
    flush,

    /**
     * 清空队列
     */
    clear(): void {
      queue.length = 0
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },

    /**
     * 获取队列大小
     */
    size(): number {
      return queue.length
    }
  }
}

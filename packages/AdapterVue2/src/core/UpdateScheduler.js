import { Batcher } from '@form-renderer/share'

/**
 * 更新调度器 - 使用 requestAnimationFrame
 *
 * 批量处理更新请求以优化性能
 *
 * @class
 */
export class UpdateScheduler {
  constructor(engine) {
    this.engine = engine
    this.batcher = new Batcher(
      (updates) => this.applyUpdates(updates),
      16 // 一帧的时间
    )
  }

  /**
   * 调度更新
   * @param {string} path - 字段路径
   * @param {*} value - 新值
   */
  schedule(path, value) {
    this.batcher.add({ path, value })
  }

  /**
   * 应用批量更新
   * @param {Object[]} updates - 更新项数组
   */
  applyUpdates(updates) {
    const values = {}
    updates.forEach(({ path, value }) => {
      values[path] = value
    })
    this.engine.updateValue(values)
  }

  /**
   * 立即刷新
   */
  flush() {
    this.batcher.flush()
  }

  /**
   * 等待刷新
   * @returns {Promise<void>}
   */
  async waitFlush() {
    return new Promise((resolve) => {
      if (this.batcher.isEmpty()) {
        resolve()
      } else {
        this.batcher.flush()
        requestAnimationFrame(() => resolve())
      }
    })
  }

  /**
   * 销毁
   */
  destroy() {
    if (this.batcher) {
      this.batcher.destroy()
      this.batcher = null
    }
  }
}

/**
 * 工厂函数
 * @param {Object} engine - FormEngine 实例
 * @returns {UpdateScheduler}
 */
export function createUpdateScheduler(engine) {
  return new UpdateScheduler(engine)
}

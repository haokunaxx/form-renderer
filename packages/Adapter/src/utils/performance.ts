/**
 * 性能监控工具
 */

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /**
   * 更新总次数
   */
  updateCount: number

  /**
   * 渲染总次数
   */
  renderCount: number

  /**
   * 平均更新耗时（ms）
   */
  averageUpdateTime: number

  /**
   * 最后一次更新耗时（ms）
   */
  lastUpdateTime: number

  /**
   * 最长更新耗时（ms）
   */
  maxUpdateTime: number

  /**
   * 最短更新耗时（ms）
   */
  minUpdateTime: number

  /**
   * 总耗时（ms）
   */
  totalTime: number
}

/**
 * 性能监控器
 */
export interface PerformanceMonitor {
  /**
   * 记录一次更新
   */
  recordUpdate: (duration: number) => void

  /**
   * 记录一次渲染
   */
  recordRender: () => void

  /**
   * 获取性能指标
   */
  getMetrics: () => PerformanceMetrics

  /**
   * 重置指标
   */
  reset: () => void

  /**
   * 打印报告
   */
  report: () => void
}

/**
 * 创建性能监控器
 *
 * @example
 * ```typescript
 * const monitor = createPerformanceMonitor()
 *
 * const { updateValue } = useFormAdapter({
 *   schema,
 *   onChange: ({ path, value }) => {
 *     const start = performance.now()
 *     handleChange(path, value)
 *     monitor.recordUpdate(performance.now() - start)
 *   }
 * })
 *
 * // 定期查看性能
 * setInterval(() => {
 *   monitor.report()
 * }, 5000)
 * ```
 */
export function createPerformanceMonitor(): PerformanceMonitor {
  const metrics: PerformanceMetrics = {
    updateCount: 0,
    renderCount: 0,
    averageUpdateTime: 0,
    lastUpdateTime: 0,
    maxUpdateTime: 0,
    minUpdateTime: Infinity,
    totalTime: 0
  }

  /**
   * 记录一次更新
   */
  const recordUpdate = (duration: number): void => {
    metrics.updateCount++
    metrics.totalTime += duration
    metrics.lastUpdateTime = duration

    // 更新平均值
    metrics.averageUpdateTime = metrics.totalTime / metrics.updateCount

    // 更新最大值
    if (duration > metrics.maxUpdateTime) {
      metrics.maxUpdateTime = duration
    }

    // 更新最小值
    if (duration < metrics.minUpdateTime) {
      metrics.minUpdateTime = duration
    }
  }

  /**
   * 记录一次渲染
   */
  const recordRender = (): void => {
    metrics.renderCount++
  }

  /**
   * 获取性能指标
   */
  const getMetrics = (): PerformanceMetrics => {
    return { ...metrics }
  }

  /**
   * 重置指标
   */
  const reset = (): void => {
    metrics.updateCount = 0
    metrics.renderCount = 0
    metrics.averageUpdateTime = 0
    metrics.lastUpdateTime = 0
    metrics.maxUpdateTime = 0
    metrics.minUpdateTime = Infinity
    metrics.totalTime = 0
  }

  /**
   * 打印性能报告
   */
  const report = (): void => {
    console.group('📊 FormAdapter 性能报告')
    console.log('更新次数:', metrics.updateCount)
    console.log('渲染次数:', metrics.renderCount)
    console.log('平均更新耗时:', metrics.averageUpdateTime.toFixed(2), 'ms')
    console.log('最后更新耗时:', metrics.lastUpdateTime.toFixed(2), 'ms')
    console.log('最长更新耗时:', metrics.maxUpdateTime.toFixed(2), 'ms')
    console.log(
      '最短更新耗时:',
      metrics.minUpdateTime === Infinity
        ? 'N/A'
        : metrics.minUpdateTime.toFixed(2) + ' ms'
    )
    console.log('总耗时:', metrics.totalTime.toFixed(2), 'ms')

    // 性能评级
    const avgTime = metrics.averageUpdateTime
    let rating = '优秀'
    if (avgTime > 50) rating = '较差'
    else if (avgTime > 30) rating = '一般'
    else if (avgTime > 15) rating = '良好'

    console.log('性能评级:', rating)
    console.groupEnd()
  }

  return {
    recordUpdate,
    recordRender,
    getMetrics,
    reset,
    report
  }
}

/**
 * 性能计时器辅助函数
 *
 * @example
 * ```typescript
 * const monitor = createPerformanceMonitor()
 *
 * const timer = measurePerformance(() => {
 *   // 你的操作
 *   updateValue('name', 'John')
 * }, (duration) => {
 *   monitor.recordUpdate(duration)
 * })
 * ```
 */
export function measurePerformance<T>(
  fn: () => T,
  callback?: (duration: number) => void
): T {
  const start = performance.now()

  try {
    const result = fn()
    const duration = performance.now() - start

    if (callback) {
      callback(duration)
    }

    return result
  } catch (error) {
    const duration = performance.now() - start
    if (callback) {
      callback(duration)
    }
    throw error
  }
}

/**
 * 异步性能计时
 *
 * @example
 * ```typescript
 * await measurePerformanceAsync(async () => {
 *   await validate()
 * }, (duration) => {
 *   console.log('校验耗时:', duration, 'ms')
 * })
 * ```
 */
export async function measurePerformanceAsync<T>(
  fn: () => Promise<T>,
  callback?: (duration: number) => void
): Promise<T> {
  const start = performance.now()

  try {
    const result = await fn()
    const duration = performance.now() - start

    if (callback) {
      callback(duration)
    }

    return result
  } catch (error) {
    const duration = performance.now() - start
    if (callback) {
      callback(duration)
    }
    throw error
  }
}

/**
 * 监控组件渲染次数
 */
export function createRenderCounter() {
  let count = 0

  return {
    increment: () => ++count,
    getCount: () => count,
    reset: () => {
      count = 0
    }
  }
}

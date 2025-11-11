/**
 * 通用工具函数
 */

/**
 * 防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn 要节流的函数
 * @param limit 限制时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true

      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 生成唯一 ID
 * @param prefix 前缀
 * @returns 唯一 ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 判断是否为空值
 * @param value 值
 * @returns 是否为空
 */
export function isEmpty(value: any): boolean {
  return (
    value === '' ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  )
}

/**
 * 深拷贝对象
 * @param obj 对象
 * @returns 拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as any
  }

  if (obj instanceof Object) {
    const clonedObj = {} as any
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }

  return obj
}

/**
 * 合并对象（深度合并）
 * @param target 目标对象
 * @param sources 源对象
 * @returns 合并后的对象
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target

  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} })
        }
        deepMerge(
          target[key] as Record<string, any>,
          source[key] as Record<string, any>
        )
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return deepMerge(target, ...sources)
}

/**
 * 判断是否为对象
 * @param item 项
 * @returns 是否为对象
 */
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * 获取嵌套对象的值
 * @param obj 对象
 * @param path 路径
 * @param defaultValue 默认值
 * @returns 值
 */
export function get(obj: any, path: string, defaultValue?: any): any {
  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) {
      return defaultValue
    }
  }

  return result
}

/**
 * 设置嵌套对象的值
 * @param obj 对象
 * @param path 路径
 * @param value 值
 */
export function set(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
}

/**
 * 按路径更新嵌套对象的值（set 的别名，用于语义化）
 * @param obj 对象
 * @param path 路径
 * @param value 值
 */
export function updateValueByPath(obj: any, path: string, value: any): void {
  set(obj, path, value)
}

/**
 * 按路径获取嵌套对象的值（get 的别名，用于语义化）
 * @param obj 对象
 * @param path 路径
 * @param defaultValue 默认值
 * @returns 值
 */
export function getValueByPath(
  obj: any,
  path: string,
  defaultValue?: any
): any {
  return get(obj, path, defaultValue)
}

/**
 * 延迟执行
 * @param ms 毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 尝试执行函数
 * @param fn 函数
 * @param fallback 失败时的返回值
 * @returns 执行结果
 */
export function tryCall<T>(fn: () => T, fallback?: T): T | undefined {
  try {
    return fn()
  } catch (error) {
    console.error('Error in tryCall:', error)
    return fallback
  }
}

/**
 * 批量执行 Promise
 * @param promises Promise 数组
 * @param concurrency 并发数
 * @returns 执行结果
 */
export async function batchPromises<T>(
  promises: (() => Promise<T>)[],
  concurrency = 5
): Promise<T[]> {
  const results: T[] = []
  const executing: Promise<void>[] = []

  for (const promiseFn of promises) {
    const promise = promiseFn().then((result) => {
      results.push(result)
    })

    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      )
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * 通用工具函数
 */

import { parsePath } from './path'

/**
 * 深拷贝对象
 * @param obj - 要拷贝的对象
 * @returns 深拷贝后的对象
 * @example
 * const obj = { a: 1, b: { c: 2 } }
 * const copy = deepClone(obj)
 * copy.b.c = 3
 * console.log(obj.b.c) // => 2
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T
  }

  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }

  return cloned
}

/**
 * 深度比较两个值是否相等
 * @param a - 第一个值
 * @param b - 第二个值
 * @returns 是否相等
 * @example
 * deepEqual({ a: 1 }, { a: 1 }) // => true
 * deepEqual({ a: 1 }, { a: 2 }) // => false
 * deepEqual([1, 2], [1, 2]) // => true
 */
export function deepEqual(a: any, b: any): boolean {
  // 严格相等
  if (a === b) {
    return true
  }

  // 类型不同
  if (typeof a !== typeof b) {
    return false
  }

  // null 检查
  if (a === null || b === null) {
    return a === b
  }

  // Date 对象
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  // RegExp 对象
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags
  }

  // 非对象
  if (typeof a !== 'object') {
    return a === b
  }

  // 数组
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false
    }
    return a.every((item, index) => deepEqual(item, b[index]))
  }

  // 一个是数组一个不是
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false
  }

  // 对象
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) {
    return false
  }

  return keysA.every((key) => deepEqual(a[key], b[key]))
}

/**
 * 判断值是否为空（根据 FormEngine 的判空规则）
 * @param value - 要判断的值
 * @returns 是否为空
 * @description
 * 判空规则：
 * - '' (空字符串) => true
 * - null => true
 * - undefined => true
 * - [] (空数组) => true
 * - 0 => false
 * - false => false
 * - {} (空对象) => false
 * @example
 * isEmpty('') // => true
 * isEmpty(null) // => true
 * isEmpty(undefined) // => true
 * isEmpty([]) // => true
 * isEmpty(0) // => false
 * isEmpty(false) // => false
 */
export function isEmpty(value: any): boolean {
  if (value === '' || value === null || value === undefined) {
    return true
  }

  if (Array.isArray(value) && value.length === 0) {
    return true
  }

  return false
}

/**
 * 判断是否为普通对象（排除 null、数组、Date 等）
 * @param obj - 要判断的对象
 * @returns 是否为普通对象
 * @example
 * isPlainObject({}) // => true
 * isPlainObject({ a: 1 }) // => true
 * isPlainObject([]) // => false
 * isPlainObject(null) // => false
 * isPlainObject(new Date()) // => false
 */
export function isPlainObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  if (Array.isArray(obj)) {
    return false
  }

  // 检查原型链
  const proto = Object.getPrototypeOf(obj)
  return proto === null || proto === Object.prototype
}

/**
 * 根据路径获取对象中的值
 * @param obj - 目标对象
 * @param path - 路径字符串，如 'list.0.field'
 * @returns 路径对应的值，不存在则返回 undefined
 * @example
 * const obj = { list: [{ field: 'value' }] }
 * getByPath(obj, 'list.0.field') // => 'value'
 * getByPath(obj, 'list.1.field') // => undefined
 */
export function getByPath(obj: any, path: string): any {
  if (!path) {
    return obj
  }

  const segments = parsePath(path)
  let current = obj

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined
    }

    current = current[segment]
  }

  return current
}

/**
 * 根据路径设置对象中的值
 * @param obj - 目标对象
 * @param path - 路径字符串
 * @param value - 要设置的值
 * @example
 * const obj = {}
 * setByPath(obj, 'list.0.field', 'value')
 * // obj => { list: [{ field: 'value' }] }
 */
export function setByPath(obj: any, path: string, value: any): void {
  if (!path) {
    return
  }

  const segments = parsePath(path)
  let current = obj

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    const nextSegment = segments[i + 1]

    // 如果当前段不存在，创建它
    if (current[segment] === undefined || current[segment] === null) {
      // 根据下一段是否为数字决定创建对象还是数组
      current[segment] = /^\d+$/.test(nextSegment) ? [] : {}
    }

    current = current[segment]
  }

  // 设置最后一段
  const lastSegment = segments[segments.length - 1]
  current[lastSegment] = value
}

/**
 * 根据路径删除对象中的值
 * @param obj - 目标对象
 * @param path - 路径字符串
 * @returns 是否成功删除
 * @example
 * const obj = { a: 1, b: { c: 2 } }
 * deleteByPath(obj, 'b.c') // => true, obj => { a: 1, b: {} }
 */
export function deleteByPath(obj: any, path: string): boolean {
  if (!path) {
    return false
  }

  const segments = parsePath(path)
  let current = obj

  // 找到父对象
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    if (current[segment] === undefined || current[segment] === null) {
      return false
    }
    current = current[segment]
  }

  // 删除最后一段
  const lastSegment = segments[segments.length - 1]
  if (lastSegment in current) {
    delete current[lastSegment]
    return true
  }

  return false
}

/**
 * 生成唯一 ID
 * @param prefix - ID 前缀
 * @returns 唯一 ID
 * @example
 * generateId() // => 'id_1234567890123'
 * generateId('batch') // => 'batch_1234567890123'
 */
export function generateId(prefix = 'id'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * 按指定键对数组进行分组
 * @param array - 要分组的数组
 * @param key - 分组键
 * @returns 分组后的对象
 * @example
 * const errors = [
 *   { path: 'a', message: 'error1' },
 *   { path: 'a', message: 'error2' },
 *   { path: 'b', message: 'error3' }
 * ]
 * groupBy(errors, 'path')
 * // => {
 * //   a: [{ path: 'a', message: 'error1' }, { path: 'a', message: 'error2' }],
 * //   b: [{ path: 'b', message: 'error3' }]
 * // }
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key])
      if (!result[groupKey]) {
        result[groupKey] = []
      }
      result[groupKey].push(item)
      return result
    },
    {} as Record<string, T[]>
  )
}

/**
 * 防抖函数
 * @param fn - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 * @example
 * const debouncedFn = debounce(() => console.log('called'), 300)
 * debouncedFn()
 * debouncedFn()
 * debouncedFn() // 只会执行一次
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn - 要节流的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 节流后的函数
 * @example
 * const throttledFn = throttle(() => console.log('called'), 300)
 * throttledFn()
 * throttledFn() // 被忽略
 * // 300ms 后
 * throttledFn() // 执行
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn.apply(this, args)
    }
  }
}

/**
 * 扁平化对象为路径-值对
 * @param obj - 要扁平化的对象
 * @param prefix - 路径前缀
 * @returns 扁平化后的对象
 * @example
 * flattenObject({ a: 1, b: { c: 2, d: [3, 4] } })
 * // => {
 * //   'a': 1,
 * //   'b.c': 2,
 * //   'b.d.0': 3,
 * //   'b.d.1': 4
 * // }
 */
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {}

  function flatten(current: any, path: string) {
    if (current === null || typeof current !== 'object') {
      result[path] = current
      return
    }

    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        const newPath = path ? `${path}.${index}` : String(index)
        flatten(item, newPath)
      })
    } else {
      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          const newPath = path ? `${path}.${key}` : key
          flatten(current[key], newPath)
        }
      }
    }
  }

  flatten(obj, prefix)
  return result
}

/**
 * 确保值为数组
 * @param value - 任意值
 * @returns 数组
 * @example
 * ensureArray(1) // => [1]
 * ensureArray([1, 2]) // => [1, 2]
 * ensureArray(null) // => []
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

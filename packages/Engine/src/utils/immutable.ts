/**
 * 不可变更新工具函数
 *
 * 核心原理：
 * - 创建新的对象/数组引用，保持路径上的引用不变性
 * - 使用结构共享（Structural Sharing）优化性能
 * - 未变化的部分复用原对象引用
 *
 * 设计参考：Immer.js, Redux, RenderNode 更新策略
 */

/**
 * 不可变地设置嵌套对象的值
 *
 * @param obj - 原对象
 * @param path - 路径，如 'a.b.c' 或 'list.0.name'
 * @param value - 新值
 * @returns 新对象（根引用必然改变，路径上的引用改变，其他部分复用）
 *
 * @example
 * const obj = { a: { b: 1 }, x: { y: 2 } }
 * const newObj = setByPathImmutable(obj, 'a.b', 3)
 * // newObj !== obj (根引用变了)
 * // newObj.a !== obj.a (路径上的引用变了)
 * // newObj.x === obj.x (结构共享，未变化的部分复用)
 */
export function setByPathImmutable(obj: any, path: string, value: any): any {
  // 处理空路径：直接返回新值
  if (!path || path === '') {
    return value
  }

  // 处理 null/undefined
  if (obj === null || obj === undefined) {
    obj = {}
  }

  // 分割路径
  const keys = path.split('.')

  // 递归实现不可变更新
  return setByKeysImmutable(obj, keys, value)
}

/**
 * 递归实现不可变更新（内部函数）
 *
 * @param obj - 当前对象
 * @param keys - 剩余路径片段
 * @param value - 目标值
 * @returns 新对象
 */
function setByKeysImmutable(obj: any, keys: string[], value: any): any {
  // 基础情况：没有更多路径，返回值
  if (keys.length === 0) {
    return value
  }

  // 基础情况：只剩一层路径
  if (keys.length === 1) {
    const key = keys[0]

    // 处理数组
    if (Array.isArray(obj)) {
      const index = parseInt(key, 10)

      // 检查索引有效性
      if (isNaN(index) || index < 0) {
        console.warn(`Invalid array index: ${key}`)
        return obj
      }

      // 创建新数组
      const newArr = [...obj]

      // 扩展数组长度（如果需要）
      while (newArr.length <= index) {
        newArr.push(undefined)
      }

      // 设置值
      newArr[index] = value
      return newArr
    }

    // 处理对象
    return { ...obj, [key]: value }
  }

  // 递归情况：多层嵌套
  const [first, ...rest] = keys

  // 处理数组
  if (Array.isArray(obj)) {
    const index = parseInt(first, 10)

    // 检查索引有效性
    if (isNaN(index) || index < 0) {
      console.warn(`Invalid array index: ${first}`)
      return obj
    }

    // 创建新数组
    const newArr = [...obj]

    // 扩展数组长度（如果需要）
    while (newArr.length <= index) {
      newArr.push(undefined)
    }

    // 递归更新数组元素
    newArr[index] = setByKeysImmutable(newArr[index] || {}, rest, value)

    return newArr
  }

  // 处理对象：创建新对象，递归更新子属性
  return {
    ...obj,
    [first]: setByKeysImmutable(obj[first] || {}, rest, value)
  }
}

/**
 * 不可变地删除嵌套对象的值
 *
 * @param obj - 原对象
 * @param path - 路径
 * @returns 新对象（删除了指定路径的属性）
 *
 * @example
 * const obj = { a: { b: 1, c: 2 } }
 * const newObj = deleteByPathImmutable(obj, 'a.b')
 * // newObj.a.b === undefined
 * // newObj.a.c === 2
 */
export function deleteByPathImmutable(obj: any, path: string): any {
  if (!path || path === '') {
    return obj
  }

  if (obj === null || obj === undefined) {
    return obj
  }

  const keys = path.split('.')
  return deleteByKeysImmutable(obj, keys)
}

/**
 * 递归实现不可变删除（内部函数）
 */
function deleteByKeysImmutable(obj: any, keys: string[]): any {
  if (keys.length === 0) {
    return obj
  }

  if (keys.length === 1) {
    const key = keys[0]

    // 处理数组
    if (Array.isArray(obj)) {
      const index = parseInt(key, 10)
      if (isNaN(index) || index < 0 || index >= obj.length) {
        return obj
      }
      // 数组删除：设置为 undefined（保持原行为，兼容 delete 操作符）
      // 注意：不使用 splice，因为会改变数组长度
      const newArr = [...obj]
      newArr[index] = undefined
      return newArr
    }

    // 处理对象
    const { [key]: _, ...rest } = obj
    return rest
  }

  // 递归情况
  const [first, ...rest] = keys

  // 处理数组
  if (Array.isArray(obj)) {
    const index = parseInt(first, 10)
    if (isNaN(index) || index < 0 || index >= obj.length) {
      return obj
    }

    const newArr = [...obj]
    newArr[index] = deleteByKeysImmutable(newArr[index], rest)
    return newArr
  }

  // 处理对象
  if (!(first in obj)) {
    return obj
  }

  return {
    ...obj,
    [first]: deleteByKeysImmutable(obj[first], rest)
  }
}

// ============ 数组不可变操作 ============

/**
 * 不可变数组追加
 *
 * @param arr - 原数组
 * @param item - 要追加的项
 * @returns 新数组
 */
export function arrayAppendImmutable(arr: any[], item: any): any[] {
  return [...arr, item]
}

/**
 * 不可变数组插入
 *
 * @param arr - 原数组
 * @param index - 插入位置
 * @param item - 要插入的项
 * @returns 新数组
 */
export function arrayInsertImmutable(
  arr: any[],
  index: number,
  item: any
): any[] {
  // 边界检查
  if (index < 0) {
    index = 0
  }
  if (index > arr.length) {
    index = arr.length
  }

  return [...arr.slice(0, index), item, ...arr.slice(index)]
}

/**
 * 不可变数组删除
 *
 * @param arr - 原数组
 * @param index - 要删除的索引
 * @returns 新数组
 */
export function arrayRemoveImmutable(arr: any[], index: number): any[] {
  // 边界检查
  if (index < 0 || index >= arr.length) {
    console.warn(`Array index out of bounds: ${index}`)
    return arr
  }

  return [...arr.slice(0, index), ...arr.slice(index + 1)]
}

/**
 * 不可变数组移动
 *
 * @param arr - 原数组
 * @param from - 源索引
 * @param to - 目标索引
 * @returns 新数组
 */
export function arrayMoveImmutable(
  arr: any[],
  from: number,
  to: number
): any[] {
  // 边界检查
  if (from < 0 || from >= arr.length || to < 0 || to >= arr.length) {
    console.warn(`Array index out of bounds: from=${from}, to=${to}`)
    return arr
  }

  // 相同位置，无需移动
  if (from === to) {
    return arr
  }

  // 创建新数组并执行移动
  const newArr = [...arr]
  const [item] = newArr.splice(from, 1)
  newArr.splice(to, 0, item)

  return newArr
}

/**
 * 不可变数组交换
 *
 * @param arr - 原数组
 * @param a - 第一个索引
 * @param b - 第二个索引
 * @returns 新数组
 */
export function arraySwapImmutable(arr: any[], a: number, b: number): any[] {
  // 边界检查
  if (a < 0 || a >= arr.length || b < 0 || b >= arr.length) {
    console.warn(`Array index out of bounds: a=${a}, b=${b}`)
    return arr
  }

  // 相同位置，无需交换
  if (a === b) {
    return arr
  }

  // 创建新数组并执行交换
  const newArr = [...arr]
  ;[newArr[a], newArr[b]] = [newArr[b], newArr[a]]

  return newArr
}

/**
 * 不可变数组替换
 *
 * @param arr - 原数组
 * @param index - 要替换的索引
 * @param item - 新项
 * @returns 新数组
 */
export function arrayReplaceImmutable(
  arr: any[],
  index: number,
  item: any
): any[] {
  // 边界检查
  if (index < 0 || index >= arr.length) {
    console.warn(`Array index out of bounds: ${index}`)
    return arr
  }

  // 创建新数组并替换
  const newArr = [...arr]
  newArr[index] = item

  return newArr
}

/**
 * 不可变数组清空
 *
 * @returns 空数组
 */
export function arrayClearImmutable(): any[] {
  return []
}

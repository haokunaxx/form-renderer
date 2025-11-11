/**
 * 浅比较 - 用于判断引用是否变化
 *
 * Engine 已经通过结构共享优化了更新，这里只需要比较引用
 * 主要用于 Vue 2 中判断是否需要触发更新
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  // 引用相等，直接返回
  if (obj1 === obj2) return true

  // 类型不同，返回 false
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false
  if (obj1 === null || obj2 === null) return false

  // 数组比较
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false
    return obj1.every((item, index) => item === obj2[index])
  }

  // 对象比较（浅层）
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  return keys1.every((key) => obj1[key] === obj2[key])
}

/**
 * 判断是否为同一引用
 *
 * Engine 的结构共享保证：如果数据没变，引用不变
 */
export function isSameReference(a: any, b: any): boolean {
  return a === b
}

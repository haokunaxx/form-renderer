/**
 * 响应式相关工具函数
 */

import { triggerRef, type ShallowRef } from 'vue'

/**
 * 触发响应式更新
 * @param ref 响应式引用
 */
export function forceUpdate<T>(ref: ShallowRef<T>): void {
  triggerRef(ref)
}

// updateValueByPath 已移至 common.ts，从那里导入
export { updateValueByPath } from './common'

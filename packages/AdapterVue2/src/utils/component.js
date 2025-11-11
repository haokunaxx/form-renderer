/**
 * 组件辅助工具
 */

/**
 * 获取组件实例的响应式引用
 *
 * Vue 2 中直接通过 this 访问
 *
 * @param {Object} vm - Vue 实例
 * @returns {Object}
 */
export function getComponentInstance(vm) {
  return vm
}

/**
 * 触发组件更新
 *
 * @param {Object} vm - Vue 实例
 */
export function forceUpdate(vm) {
  if (vm && vm.$forceUpdate) {
    vm.$forceUpdate()
  }
}

/**
 * 获取组件 props
 *
 * @param {Object} vm - Vue 实例
 * @returns {Object}
 */
export function getProps(vm) {
  return vm.$props || {}
}

/**
 * 发射事件
 *
 * @param {Object} vm - Vue 实例
 * @param {string} event - 事件名
 * @param {...*} args - 事件参数
 */
export function emit(vm, event, ...args) {
  if (vm && vm.$emit) {
    vm.$emit(event, ...args)
  }
}

/**
 * Vue 2 响应式辅助工具
 */

import Vue from 'vue'

/**
 * 创建响应式数据
 *
 * Vue 2.6 的 Vue.observable 包装
 *
 * @param {Object} data - 数据对象
 * @returns {Object} 响应式数据
 */
export function observable(data) {
  return Vue.observable(data)
}

/**
 * 检查是否为响应式对象
 *
 * @param {*} obj - 要检查的对象
 * @returns {boolean}
 */
export function isReactive(obj) {
  return obj && obj.__ob__ !== undefined
}

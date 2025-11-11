import { normalizeComponent } from '@form-renderer/share'

/**
 * 组件注册表
 *
 * 管理所有可用的组件定义
 *
 * @class
 */
export class ComponentRegistry {
  constructor() {
    /** @type {Map<string, Object>} */
    this.registry = new Map()

    /** @type {Object|null} */
    this.currentPreset = null
  }

  /**
   * 注册单个组件
   * @param {Object} definition - 组件定义
   */
  register(definition) {
    const normalized = normalizeComponent(definition)
    this.registry.set(normalized.name, normalized)
  }

  /**
   * 批量注册
   * @param {Object[]} definitions - 组件定义数组
   */
  registerBatch(definitions) {
    definitions.forEach((def) => this.register(def))
  }

  /**
   * 注册预设
   * @param {Object} preset - 组件预设
   */
  registerPreset(preset) {
    if (preset.setup) {
      preset.setup()
    }
    this.registerBatch(preset.components)
    // 保存 preset 的其他信息
    this.currentPreset = preset
  }

  /**
   * 获取组件定义
   * @param {string} name - 组件名称
   * @returns {Object|undefined}
   */
  get(name) {
    return this.registry.get(name)
  }

  /**
   * 检查组件是否存在
   * @param {string} name - 组件名称
   * @returns {boolean}
   */
  has(name) {
    return this.registry.has(name)
  }

  /**
   * 按类型获取组件
   * @param {string} type - 组件类型
   * @returns {Object[]}
   */
  getByType(type) {
    return Array.from(this.registry.values()).filter((def) => def.type === type)
  }

  /**
   * 清空注册表
   */
  clear() {
    this.registry.clear()
    this.currentPreset = null
  }

  /**
   * 获取当前预设
   * @returns {Object|null}
   */
  getPreset() {
    return this.currentPreset
  }
}

/**
 * 工厂函数
 * @returns {ComponentRegistry}
 */
export function createComponentRegistry() {
  return new ComponentRegistry()
}

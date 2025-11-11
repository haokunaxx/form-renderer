import { ValueChange, ChangeSet } from '../types'
import {
  getByPath,
  deepClone,
  deepEqual,
  flattenObject,
  isPlainObject,
  setByPathImmutable,
  deleteByPathImmutable
} from '../utils'
import { expandWildcard } from '../utils/match'

/**
 * ModelManager 错误类
 */
export class ModelManagerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModelManagerError'
  }
}

/**
 * FormModel 管理器
 * 负责管理表单数据，提供路径级别的读写能力
 */
export class ModelManager {
  private model: any
  private initialModel: any

  /**
   * 构造函数
   * @param initialModel - 初始 FormModel，默认为空对象
   */
  constructor(initialModel: any = {}) {
    this.initialModel = deepClone(initialModel)
    this.model = deepClone(initialModel)
  }

  /**
   * 获取指定路径的值
   * @param path - 路径，不传或传空字符串则返回整个 model
   * @returns 路径对应的值，路径不存在返回 undefined
   */
  getValue(path?: string): any {
    // 不传参或空字符串：返回整个 model
    if (!path || path === '') {
      return this.model
    }

    // 使用工具函数读取
    return getByPath(this.model, path)
  }

  /**
   * 设置指定路径的值（不可变更新）
   * @param path - 路径
   * @param value - 新值
   * @returns 值变更记录
   */
  setValue(path: string, value: any): ValueChange {
    if (!path || path === '') {
      throw new ModelManagerError('Path cannot be empty for setValue')
    }

    // 获取旧值
    const prevValue = this.getValue(path)

    // 🔥 不可变更新：创建新的 model 引用
    this.model = setByPathImmutable(this.model, path, value)

    // 返回变更记录
    return {
      path,
      prevValue,
      nextValue: value
    }
  }

  /**
   * 批量设置值
   * @param updates - 更新数组
   * @returns 变更集合
   */
  batchSetValue(updates: Array<{ path: string; value: any }>): ChangeSet {
    const changes: ValueChange[] = []

    for (const { path, value } of updates) {
      const change = this.setValue(path, value)
      changes.push(change)
    }

    return { changes }
  }

  /**
   * 删除指定路径的值（不可变更新）
   * @param path - 路径
   * @returns 值变更记录
   */
  deleteValue(path: string): ValueChange {
    if (!path || path === '') {
      throw new ModelManagerError('Path cannot be empty for deleteValue')
    }

    // 获取旧值
    const prevValue = this.getValue(path)

    // 🔥 不可变删除：创建新的 model 引用
    this.model = deleteByPathImmutable(this.model, path)

    // 返回变更记录
    return {
      path,
      prevValue,
      nextValue: undefined
    }
  }

  /**
   * 展开通配符路径为具体路径数组
   * @param pattern - 通配符模式，如 'list.*.field'
   * @returns 具体路径数组
   */
  expandWildcard(pattern: string): string[] {
    return expandWildcard(pattern, this.model)
  }

  /**
   * 获取只读快照（深拷贝）
   * @returns model 的深拷贝
   */
  getSnapshot(): any {
    return deepClone(this.model)
  }

  /**
   * 克隆 ModelManager
   * @returns 新的 ModelManager 实例
   */
  clone(): ModelManager {
    const cloned = new ModelManager(this.initialModel)
    cloned.model = deepClone(this.model)
    return cloned
  }

  /**
   * 重置到初始值或指定值
   * @param newModel - 新的 model，不传则重置到初始值
   * @returns 变更集合
   */
  reset(newModel?: any): ChangeSet {
    // 确定目标 model
    const targetModel = newModel !== undefined ? newModel : this.initialModel

    // Diff 计算
    const changes = this.diffModels(this.model, targetModel)

    // 替换 model
    this.model = deepClone(targetModel)

    // 如果传入了新的 model，更新 initialModel
    if (newModel !== undefined) {
      this.initialModel = deepClone(newModel)
    }

    return { changes }
  }

  /**
   * 比较两个 model，返回变更列表
   * @param oldModel - 旧 model
   * @param newModel - 新 model
   * @returns 变更数组
   */
  private diffModels(oldModel: any, newModel: any): ValueChange[] {
    const changes: ValueChange[] = []

    // 扁平化对比
    const oldFlat = flattenObject(oldModel)
    const newFlat = flattenObject(newModel)

    // 找出所有路径
    const allPaths = new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)])

    for (const path of allPaths) {
      const oldValue = oldFlat[path]
      const newValue = newFlat[path]

      // 值不相等才记录变更
      if (!deepEqual(oldValue, newValue)) {
        changes.push({
          path,
          prevValue: oldValue,
          nextValue: newValue
        })
      }
    }

    return changes
  }

  /**
   * 合并部分数据到 model
   * @param partialModel - 部分数据
   * @returns 变更集合
   */
  merge(partialModel: any): ChangeSet {
    if (!isPlainObject(partialModel)) {
      throw new ModelManagerError('Partial model must be a plain object')
    }

    const changes: ValueChange[] = []
    const flat = flattenObject(partialModel)

    for (const [path, value] of Object.entries(flat)) {
      const change = this.setValue(path, value)
      changes.push(change)
    }

    return { changes }
  }

  /**
   * 检查路径是否存在
   * @param path - 路径
   * @returns 是否存在
   */
  hasPath(path: string): boolean {
    return this.getValue(path) !== undefined
  }

  /**
   * 获取初始 model 的快照
   * @returns 初始 model 的深拷贝
   */
  getInitialSnapshot(): any {
    return deepClone(this.initialModel)
  }

  /**
   * 清空当前 model 的所有值，但保持结构不变
   * @returns 变更集合
   */
  clear(): ChangeSet {
    const clearedModel = this.clearValues(this.model)
    const changes = this.diffModels(this.model, clearedModel)
    this.model = clearedModel
    return { changes }
  }

  /**
   * 递归清空值，保持结构
   * @param value - 要清空的值
   * @returns 清空后的值
   */
  private clearValues(value: any): any {
    // 处理 null 和 undefined
    if (value === null || value === undefined) {
      return value
    }

    // 处理数组：保持数组长度，递归清空每个元素
    if (Array.isArray(value)) {
      return value.map((item) => this.clearValues(item))
    }

    // 处理对象：递归清空所有属性
    if (isPlainObject(value)) {
      const cleared: any = {}
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          cleared[key] = this.clearValues(value[key])
        }
      }
      return cleared
    }

    // 处理基本类型：根据类型返回对应的空值
    const type = typeof value
    switch (type) {
      case 'string':
        return ''
      case 'number':
        return undefined
      case 'boolean':
        return undefined
      default:
        return undefined
    }
  }
}

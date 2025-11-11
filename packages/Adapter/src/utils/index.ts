/**
 * 工具函数导出
 */

// 导出通用工具（不与 core 模块冲突的部分）
export {
  debounce,
  throttle,
  generateId,
  isEmpty,
  deepClone,
  deepMerge,
  get,
  set,
  updateValueByPath,
  getValueByPath,
  delay,
  tryCall,
  batchPromises
} from './common'

export {
  isComponentPreset,
  createDefinitionsFromMap,
  createRenderContext,
  mergeComponentProps,
  getEventMapping,
  needsFormItem
} from './component'

export * from './batch'
export * from './performance'
export * from './validation-helpers'

// 注意：reactive.ts 中的函数主要供内部使用，避免与 core 模块冲突

// PresetElementPlus 主入口文件

// 导出预设创建函数和预设对象（符合 Adapter 规范）
export {
  createElementPlusPreset,
  ElementPlusPreset,
  default as ElementPlusPresetDefault
} from './adapter-preset'

// 导出类型定义
export * from './event-mapping'
export type * from './types'

// 导出组件（供高级用户使用）
export * from './widgets'
export * from './containers'
export * from './wrappers'

// 导出校验工具（供自定义使用）
export * from './validation'

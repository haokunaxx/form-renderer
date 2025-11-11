/**
 * Adapter - Vue3 表单适配器
 *
 * 基于 FormEngine 的 Vue3 表单渲染解决方案
 */

// 导出类型定义（避免重复导出，只导出 types 中定义的类型）
export type {
  ComponentType,
  RuleConverter,
  ValueTransformer,
  EventMapping,
  ComponentDefinition,
  ComponentPreset,
  RenderContext,
  ThemeConfig,
  FormSchema,
  FormModel
} from './types'

// 导出工具函数
export * from './utils'

// 导出核心模块（类和函数）
export {
  ComponentRegistry,
  createComponentRegistry,
  normalizeComponent,
  normalizeComponents,
  defineFieldComponent,
  defineLayoutComponent,
  defineListComponent,
  mergeComponentDefinition,
  wrapWithCommonProps,
  defineInputComponent,
  defineSelectComponent,
  defineDateComponent,
  defineNumberComponent,
  defineBooleanComponent,
  ReactiveEngine,
  createReactiveEngine,
  UpdateScheduler,
  createUpdateScheduler,
  EventHandler,
  createEventHandler,
  TransformError
} from './core'

// 导出核心模块的类型
export type {
  NormalizeOptions,
  ReactiveEngineOptions,
  EventHandlerOptions
} from './core'

// 导出组件
export * from './components'

// 导出组合式函数（函数和类型）
export {
  useFormAdapter,
  useFieldComponent,
  createFieldProps,
  createFieldEmits
} from './composables'

export type {
  UseFormAdapterOptions,
  UseFormAdapterReturn,
  ValidationErrors,
  UseFieldComponentOptions,
  UseFieldComponentReturn,
  FieldComponentProps,
  FieldComponentEmits
} from './composables'

// 导出版本信息
export const version = '0.0.1'

// 主要导出（方便使用）
export { FormAdapter } from './components'

/**
 * 安装函数（Vue 插件）
 */
export function install(_app: any) {
  // 后续实现：注册全局组件
  console.log('Adapter installed', version)
}

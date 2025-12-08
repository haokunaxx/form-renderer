/**
 * React Adapter 类型定义
 */

import type { ComponentType as ReactComponentType } from 'react'
import type {
  RenderNode,
  ValidationResult,
  JsonSchemaNode,
  FormEngineOptions
} from '@form-renderer/engine'
import type { StateEngine as StateEngineClass } from './core/StateEngine'

// 重新导出 StateEngine 类型
export type StateEngine = StateEngineClass

// 类型别名
export type FormSchema = JsonSchemaNode
export type FormModel = Record<string, any>

// ============= 组件定义相关 =============

/**
 * 组件类型
 */
export type ComponentType = 'field' | 'layout' | 'list' | 'form'

/**
 * Rule 转换器类型
 */
export type RuleConverter = (
  node: RenderNode,
  computed: Record<string, any>,
  context: RenderContext
) => any[]

/**
 * 值转换器
 */
export interface ValueTransformer<T = any, U = any> {
  /**
   * 引擎值转组件值
   */
  toComponent: (engineValue: T) => U

  /**
   * 组件值转引擎值
   */
  fromComponent: (componentValue: U) => T
}

/**
 * 事件映射
 * React 版本：可以直接是字符串（事件名）或函数（事件处理器）
 */
export interface EventMapping {
  /**
   * 值变化事件
   * 可以是事件名或提取值的函数
   */
  onChange?: string | ((eventOrValue: any) => any)

  /**
   * 输入事件
   */
  onInput?: string | ((eventOrValue: any) => any)

  /**
   * 聚焦事件
   */
  onFocus?: string | ((event: any) => void)

  /**
   * 失焦事件
   */
  onBlur?: string | ((event: any) => void)
}

/**
 * 组件定义
 */
export interface ComponentDefinition<T = any> {
  /**
   * 组件名称（唯一标识）
   */
  name: string

  /**
   * React 组件
   */
  component: ReactComponentType<any>

  /**
   * 组件类型
   */
  type: ComponentType

  /**
   * 默认属性
   */
  defaultProps?: Record<string, any>

  /**
   * 值转换器
   */
  valueTransformer?: ValueTransformer<T>

  /**
   * 事件映射
   */
  eventMapping?: EventMapping

  /**
   * 是否需要 FormItem 包裹
   */
  needFormItem?: boolean

  /**
   * 自定义渲染逻辑
   */
  customRender?: (props: RenderProps) => React.ReactElement | null
}

/**
 * 组件预设
 */
export interface ComponentPreset {
  /**
   * 预设名称
   */
  name: string

  /**
   * 组件定义列表
   */
  components: ComponentDefinition[]

  /**
   * 表单项包装组件
   */
  formItem?: ReactComponentType<any>

  /**
   * Rule 转换器
   */
  ruleConverter?: RuleConverter

  /**
   * 主题配置
   */
  theme?: ThemeConfig

  /**
   * 初始化函数
   */
  setup?: () => void | Promise<void>
}

// ============= 渲染相关 =============

/**
 * 渲染上下文
 */
export interface RenderContext {
  /**
   * StateEngine 实例
   */
  engine: StateEngine

  /**
   * 组件注册表
   */
  registry: ComponentRegistry

  /**
   * 事件处理器
   */
  eventHandler?: any

  /**
   * 当前渲染路径
   */
  path: string[]

  /**
   * 渲染深度
   */
  depth: number

  /**
   * 父节点类型
   */
  parentType?: ComponentType

  /**
   * 列表行索引
   */
  rowIndex?: number

  /**
   * FormItem 组件
   */
  formItem?: ReactComponentType<any>

  /**
   * Rule 转换器
   */
  ruleConverter?: RuleConverter
}

/**
 * 渲染属性
 */
export interface RenderProps {
  /**
   * 渲染节点
   */
  node: RenderNode

  /**
   * 渲染上下文
   */
  context: RenderContext

  /**
   * 字段值
   */
  value?: any

  /**
   * 更新值函数
   */
  updateValue?: (value: any) => void
}

// ============= 配置相关 =============

/**
 * 渲染配置
 */
export interface RenderOptions {
  showRequiredAsterisk?: boolean
  labelAlign?: 'left' | 'right' | 'top'
  labelWidth?: string | number
  errorDisplay?: 'inline' | 'block' | 'tooltip'
  colon?: boolean
  layout?: 'horizontal' | 'vertical' | 'inline'
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  size?: 'large' | 'default' | 'small'
  classPrefix?: string
  cssVariables?: Record<string, string>
}

/**
 * 适配器配置
 */
export interface AdapterOptions {
  renderOptions?: RenderOptions
  theme?: ThemeConfig
}

// ============= 组件接口规范 =============

/**
 * 字段组件接口
 */
export interface FieldComponentProps {
  value: any
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  onChange?: (value: any) => void
  onFocus?: (event: any) => void
  onBlur?: (event: any) => void
  [key: string]: any
}

/**
 * 布局组件接口
 */
export interface LayoutComponentProps {
  title?: string
  children?: React.ReactNode
  [key: string]: any
}

/**
 * 列表组件接口
 */
export interface ListComponentProps {
  rows: any[]
  title?: string
  maxRows?: number
  minRows?: number
  onAdd?: () => void
  onRemove?: (index: number) => void
  onMove?: (from: number, to: number) => void
  children?: React.ReactNode
}

// ============= API 相关 =============

/**
 * FormAdapter 组件属性
 */
export interface FormAdapterProps {
  schema: FormSchema
  model?: FormModel
  components?: ComponentDefinition[] | ComponentPreset
  onChange?: (event: { path: string; value: any }) => void
  onValidate?: (result: ValidationResult) => void
  onSubmit?: (data: FormModel) => void
  onReady?: (engine: StateEngine) => void
}

/**
 * FormAdapter Ref 接口
 */
export interface FormAdapterRef {
  getValue: (path?: string) => any
  updateValue: (path: string, value: any) => void
  updateValues: (values: Record<string, any>) => void
  validate: (paths?: string[]) => Promise<ValidationResult>
  submit: () => Promise<void>
  reset: (target?: any | 'default') => void
  getEngine: () => StateEngine | undefined
  getRegistry: () => ComponentRegistry | undefined
  getEventHandler: () => any | undefined
  flush: () => void
}

/**
 * useFormAdapter Hook 选项
 */
export interface UseFormAdapterOptions {
  schema: FormSchema
  model?: FormModel
  components?: ComponentDefinition[] | ComponentPreset
  onSubmit?: (data: FormModel) => void | Promise<void>
  onChange?: (event: { path: string; value: any }) => void
  onValidate?: (result: ValidationResult) => void
  onReady?: (engine: StateEngine) => void
}

/**
 * useFormAdapter Hook 返回值
 */
export interface UseFormAdapterReturn {
  renderSchema: RenderNode | null
  model: FormModel
  engine: StateEngine | undefined
  registry: ComponentRegistry | undefined
  eventHandler: any | undefined
  loading: boolean
  errors: ValidationErrors | undefined
  getValue: (path?: string) => any
  updateValue: (path: string, value: any) => void
  updateValues: (values: Record<string, any>) => void
  validate: (paths?: string[]) => Promise<ValidationResult>
  submit: () => Promise<void>
  reset: (target?: any | 'default') => void
  flush: () => void
  registerComponent: (definition: ComponentDefinition) => void
  registerComponents: (definitions: ComponentDefinition[]) => void
  registerPreset: (preset: ComponentPreset) => void
  getListOperator: (path: string) => ListOperator | undefined
}

// ============= 内部类型 =============

/**
 * 组件注册表
 */
export interface ComponentRegistry {
  register(definition: ComponentDefinition): void
  registerBatch(definitions: ComponentDefinition[]): void
  get(name: string): ComponentDefinition | undefined
  has(name: string): boolean
  getByType(type: ComponentType): ComponentDefinition[]
  registerPreset(preset: ComponentPreset): void
  clear(): void
}

/**
 * 列表操作器
 */
export interface ListOperator {
  append: (row: any) => void
  insert: (index: number, row: any) => void
  remove: (index: number) => void
  move: (from: number, to: number) => void
  swap: (a: number, b: number) => void
  replace: (index: number, row: any) => void
  clear: () => void
}

/**
 * 验证错误
 */
export interface ValidationErrors {
  errors: Array<{
    path: string
    message: string
    code?: string
  }>
  errorByPath: Record<
    string,
    Array<{
      message: string
      code?: string
    }>
  >
}

// ============= 工具类型 =============

/**
 * 深度只读
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * 可选属性
 */
export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}

/**
 * 组件值类型
 */
export type ComponentValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'date'
  | 'custom'

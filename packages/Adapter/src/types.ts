/**
 * Adapter 类型定义
 */

import type { Component, VNode } from 'vue'
import type {
  RenderNode,
  ValidationResult,
  JsonSchemaNode,
  FormEngineOptions
} from '@form-renderer/engine'
import type { ReactiveEngine as ReactiveEngineClass } from './core/ReactiveEngine'

// 重新导出实际的 ReactiveEngine 类型
export type ReactiveEngine = ReactiveEngineClass

// 类型别名：FormEngine 中使用 JsonSchemaNode 作为 Schema 类型
export type FormSchema = JsonSchemaNode
export type FormModel = Record<string, any>

// ============= 组件定义相关 =============

/**
 * 组件类型
 */
export type ComponentType = 'field' | 'layout' | 'list' | 'form'

/**
 * Rule 转换器类型
 *
 * 将 Engine 的 validators 转换为 UI 框架特定的 rules 格式。
 *
 * @param node - 渲染节点（包含 validators、required 等）
 * @param computed - 计算属性（包含 disabled、show 等）
 * @param context - 渲染上下文（包含 engine 等，用于访问表单数据）
 * @returns 框架特定的 rules 数组
 *
 * @example
 * ```ts
 * const converter: RuleConverter = (node, computed, context) => {
 *   if (!computed.show || computed.disabled) {
 *     return []
 *   }
 *
 *   const rules = []
 *   if (computed.required) {
 *     rules.push({ required: true, message: '必填' })
 *   }
 *   // 可以使用 context.engine 访问表单数据
 *   // 转换 validators...
 *   return rules
 * }
 * ```
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
 */
export interface EventMapping {
  /**
   * 值变化事件，默认: 'update:modelValue'
   */
  onChange?: string

  /**
   * 输入事件（某些组件需要）
   */
  onInput?: string

  /**
   * 聚焦事件
   */
  onFocus?: string

  /**
   * 失焦事件
   */
  onBlur?: string
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
   * Vue 组件
   */
  component: Component

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
  customRender?: (props: RenderProps) => VNode
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
   * 表单项包装组件（如 UI 库的 FormItem）
   */
  formItem?: Component

  /**
   * Rule 转换器（可选）
   *
   * 用于将 Engine 的 validators 转换为 UI 框架的 rules
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
   * FormEngine 实例
   */
  engine: ReactiveEngine

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
   * 列表行索引（列表项专用）
   */
  rowIndex?: number

  /**
   * FormItem 组件
   */
  formItem?: Component

  /**
   * Rule 转换器（可选）
   */
  ruleConverter?: RuleConverter

  /**
   * 配置选项
   */
  options?: any
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
   * 字段值（字段组件专用）
   */
  value?: any

  /**
   * 更新值函数（字段组件专用）
   */
  updateValue?: (value: any) => void
}

// ============= 配置相关 =============

/**
 * 渲染配置
 */
export interface RenderOptions {
  /**
   * 是否显示必填星号
   */
  showRequiredAsterisk?: boolean

  /**
   * 标签对齐方式
   */
  labelAlign?: 'left' | 'right' | 'top'

  /**
   * 标签宽度
   */
  labelWidth?: string | number

  /**
   * 错误显示方式
   */
  errorDisplay?: 'inline' | 'block' | 'tooltip'

  /**
   * 是否显示冒号
   */
  colon?: boolean

  /**
   * 表单布局
   */
  layout?: 'horizontal' | 'vertical' | 'inline'
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  /**
   * 组件大小
   */
  size?: 'large' | 'default' | 'small'

  /**
   * 自定义类名前缀
   */
  classPrefix?: string

  /**
   * 自定义样式变量
   */
  cssVariables?: Record<string, string>
}

/**
 * 适配器配置
 */
export interface AdapterOptions {
  /**
   * 引擎配置
   */
  engineOptions?: FormEngineOptions

  /**
   * 渲染配置
   */
  renderOptions?: RenderOptions

  /**
   * 主题配置
   */
  theme?: ThemeConfig
}

// ============= 组件接口规范 =============

/**
 * 字段组件接口
 */
export interface FieldComponentProps {
  /**
   * 绑定值
   */
  modelValue: any

  /**
   * 禁用状态
   */
  disabled?: boolean

  /**
   * 只读状态
   */
  readonly?: boolean

  /**
   * 占位符
   */
  placeholder?: string

  /**
   * 其他属性
   */
  [key: string]: any
}

/**
 * 字段组件事件
 */
export interface FieldComponentEmits {
  /**
   * 值更新
   */
  'update:modelValue': (value: any) => void

  /**
   * 聚焦
   */
  focus?: (event: FocusEvent) => void

  /**
   * 失焦
   */
  blur?: (event: FocusEvent) => void

  /**
   * 值变化
   */
  change?: (value: any) => void
}

/**
 * 布局组件接口
 */
export interface LayoutComponentProps {
  /**
   * 标题
   */
  title?: string

  /**
   * 其他布局相关属性
   */
  [key: string]: any
}

/**
 * 列表组件接口
 */
export interface ListComponentProps {
  /**
   * 行数据
   */
  rows: any[]

  /**
   * 标题
   */
  title?: string

  /**
   * 最大行数
   */
  maxRows?: number

  /**
   * 最小行数
   */
  minRows?: number
}

/**
 * 列表组件事件
 */
export interface ListComponentEmits {
  /**
   * 添加行
   */
  add: () => void

  /**
   * 删除行
   */
  remove: (index: number) => void

  /**
   * 移动行
   */
  move: (from: number, to: number) => void
}

// ============= API 相关 =============

/**
 * FormAdapter 组件属性
 */
export interface FormAdapterProps {
  /**
   * 表单 Schema
   */
  schema: FormSchema

  /**
   * 表单数据
   */
  model?: Record<string, any>

  /**
   * 组件映射
   */
  components?: Record<string, Component> | ComponentPreset

  /**
   * 配置选项
   */
  options?: AdapterOptions
}

/**
 * FormAdapter 组件事件
 */
export interface FormAdapterEmits {
  /**
   * 数据更新
   */
  'update:model': (model: Record<string, any>) => void

  /**
   * 校验事件
   */
  validate: (result: ValidationResult) => void

  /**
   * 提交事件
   */
  submit: (data: Record<string, any>) => void

  /**
   * 初始化完成
   */
  ready: () => void
}

/**
 * 组合式 API 选项
 */
export interface UseFormAdapterOptions {
  /**
   * 表单 Schema
   */
  schema: FormSchema

  /**
   * 表单数据
   */
  model?: Record<string, any>

  /**
   * 组件配置
   */
  components?: ComponentDefinition[]

  /**
   * 提交处理函数
   */
  onSubmit?: (data: Record<string, any>) => void | Promise<void>

  /**
   * 配置选项
   */
  options?: AdapterOptions
}

// ============= 内部类型 =============

// ReactiveEngine 类型已在文件顶部通过导入和重新导出定义

/**
 * 组件注册表（内部使用）
 */
export interface ComponentRegistry {
  /**
   * 注册组件
   */
  register(definition: ComponentDefinition): void

  /**
   * 批量注册
   */
  registerBatch(definitions: ComponentDefinition[]): void

  /**
   * 获取组件定义
   */
  get(name: string): ComponentDefinition | undefined

  /**
   * 检查组件是否存在
   */
  has(name: string): boolean

  /**
   * 按类型获取组件
   */
  getByType(type: ComponentType): ComponentDefinition[]

  /**
   * 注册预设
   */
  registerPreset(preset: ComponentPreset): void

  /**
   * 清空注册表
   */
  clear(): void
}

/**
 * 更新项（批量更新用）
 */
export interface UpdateItem {
  /**
   * 更新路径
   */
  path: string

  /**
   * 更新值
   */
  value: any
}

/**
 * 验证错误
 */
export interface ValidationErrors {
  /**
   * 错误列表
   */
  errors: Array<{
    path: string
    message: string
    code?: string
  }>

  /**
   * 按路径分组的错误
   */
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

/**
 * 组件定义选项（用于 defineFieldComponent）
 */
export interface DefineFieldOptions {
  /**
   * 组件名称
   */
  name: string

  /**
   * Vue 组件
   */
  component: Component

  /**
   * 值类型
   */
  valueType?: ComponentValueType

  /**
   * 默认属性
   */
  defaultProps?: Record<string, any>

  /**
   * 自定义值转换器
   */
  valueTransformer?: ValueTransformer

  /**
   * 是否需要 FormItem
   */
  needFormItem?: boolean
}

/**
 * FormEngine 核心类型定义
 */

// ============================================================================
// Schema 相关类型
// ============================================================================

/**
 * Schema 节点类型
 */
export type NodeType = 'form' | 'layout' | 'list' | 'field'

/**
 * 控制属性函数上下文
 */
export interface Context {
  /** 当前节点的绝对路径，如 'list.1.field' */
  path: string
  /** 获取指定路径的 Schema，不传参则返回当前节点 Schema */
  getSchema: (path?: string) => any
  /** 获取指定路径的值，不传参则返回当前节点值 */
  getValue: (path?: string) => any
  /** 获取最近一层 list 的当前行对象值 */
  getCurRowValue: () => any
  /** 获取最近一层 list 的当前行索引 */
  getCurRowIndex: () => number
}

/**
 * DefaultValue 上下文基础接口
 */
interface DefaultValueContextBase {
  /** 获取指定路径的值，不传参则返回根 model */
  getValue: (path?: string) => any
}

/**
 * 初始化场景的上下文
 */
export interface InitContext extends DefaultValueContextBase {
  mode: 'init'
}

/**
 * List 添加行场景的上下文
 */
export interface ListAddContext extends DefaultValueContextBase {
  mode: 'list-add'
  /** 获取当前列表的长度（添加前） */
  getListLength: () => number
  /** 获取当前正在构建的行数据 */
  getRowData: () => any
}

/**
 * Reset 场景的上下文
 */
export interface ResetContext extends DefaultValueContextBase {
  mode: 'reset'
}

/**
 * Clear 场景的上下文
 */
export interface ClearContext extends DefaultValueContextBase {
  mode: 'clear'
}

/**
 * DefaultValue 函数的上下文类型（联合类型）
 */
export type DefaultValueContext =
  | InitContext
  | ListAddContext
  | ResetContext
  | ClearContext

/**
 * 控制属性类型（支持三种写法）
 */
export type ControlAttr =
  | boolean
  | ((ctx: Context) => boolean)
  | {
      when: boolean | ((ctx: Context) => boolean)
      deps?: string[]
    }

/**
 * 校验器函数
 */
type ValidatorResult = string | FieldError | void | boolean
export type ValidatorFn = (
  value: any,
  ctx: Context
) => ValidatorResult | Promise<ValidatorResult>

/**
 * 字段错误信息
 */
export interface FieldError {
  path: string
  message: string
  code?: string
}

/**
 * 校验结果
 */
export interface ValidationResultError {
  ok: false
  errors: FieldError[]
  errorByPath: Record<string, FieldError[]>
}
export type ValidationResult = true | ValidationResultError

/**
 * JSON Schema 节点 (输入)
 */
export interface JsonSchemaNode {
  type: NodeType
  prop?: string

  // 控制属性
  required?: ControlAttr
  disabled?: ControlAttr
  readonly?: ControlAttr
  ifShow?: ControlAttr
  show?: ControlAttr

  // 订阅
  subscribes?: Record<string, Subscribe> | SubscribeItem[]

  // 结构
  properties?: Record<string, JsonSchemaNode>
  items?: Record<string, JsonSchemaNode>

  // UI 相关
  component?: string
  componentProps?: any | ((ctx: Context) => any)
  formItemProps?: any | ((ctx: Context) => any)
  formProps?: any

  // 校验
  validators?: ValidatorFn[]

  // 默认值（用于初始化、List 添加行、reset/clear 等场景）
  defaultValue?: any | ((ctx: DefaultValueContext) => any)

  // 其他任意属性
  [key: string]: any
}

/**
 * 解析后的 Schema 节点 (内部)
 */
export interface SchemaNode {
  type: NodeType
  prop?: string
  path: string // 绝对路径，如 'list.items.field'

  // 控制属性
  required?: ControlAttr
  disabled?: ControlAttr
  readonly?: ControlAttr
  ifShow?: ControlAttr
  show?: ControlAttr

  // 订阅
  subscribes?: Record<string, Subscribe> | SubscribeItem[]

  // 结构
  properties?: Record<string, SchemaNode>
  items?: Record<string, SchemaNode>

  // UI 相关
  component?: string
  componentProps?: any | ((ctx: Context) => any)
  formItemProps?: any | ((ctx: Context) => any)
  formProps?: any

  // 校验
  validators?: ValidatorFn[]

  // 默认值
  defaultValue?: any | ((ctx: DefaultValueContext) => any)

  // 父节点引用
  parent?: SchemaNode

  // 其他属性
  [key: string]: any
}

/**
 * 渲染 Schema 节点 (输出给 UI)
 */
export interface RenderNode {
  type: NodeType
  prop?: string
  path: string // 具体路径，如 'list.0.field'

  // 原始控制属性 (供 ControlEngine 计算使用)
  required?: ControlAttr
  disabled?: ControlAttr
  readonly?: ControlAttr
  ifShow?: ControlAttr
  show?: ControlAttr

  // 已计算的控制属性 (布尔值，由 ControlEngine 写入)
  computed?: {
    required: boolean
    disabled: boolean
    readonly: boolean
    ifShow: boolean
    show: boolean
    componentProps?: any
    formItemProps?: any
  }

  // 结构 (使用 children 而非 properties)
  children?: RenderNode[] | RenderNode[][] // list 的 children 是二维数组

  // UI 相关
  component?: string
  componentProps?: any
  formItemProps?: any
  formProps?: any

  // 校验
  validators?: ValidatorFn[]

  // 默认值
  defaultValue?: any | ((ctx: DefaultValueContext) => any)

  // 其他属性
  [key: string]: any
}

/**
 * 表单 Schema 类型别名（用于用户输入）
 */
export type FormSchema = JsonSchemaNode

/**
 * 表单数据类型别名（用于用户输入）
 */
export type FormModel = Record<string, any>

/**
 * 渲染 Schema 类型别名（用于 UI 渲染）
 */
export type RenderSchema = RenderNode

// ============================================================================
// 订阅相关类型
// ============================================================================

/**
 * 订阅处理函数
 */
export type SubscribeHandler = (
  ctx: SubscribeHandlerContext
) => void | Promise<void>

/**
 * 订阅声明
 */
export type Subscribe =
  | SubscribeHandler
  | {
      handler: SubscribeHandler
      debounce?: boolean
      [key: string]: any
    }

/**
 * 订阅项 (数组格式)
 */
export interface SubscribeItem {
  target: string
  handler: SubscribeHandler
  debounce?: boolean
  [key: string]: any
}

/**
 * 订阅声明 (Schema 解析后的订阅信息)
 */
export interface SubscribeDeclaration {
  /** 订阅者的路径（谁在监听） */
  subscriberPath: string
  /** 订阅者的 prop 名 */
  subscriberProp?: string
  /** 订阅目标路径（监听谁） */
  target: string
  /** 处理函数 */
  handler: SubscribeHandler
  /** 额外选项（如 debounce 等） */
  options?: Record<string, any>
}

/**
 * 值变化事件
 */
export interface ValueEvent {
  kind: 'value'
  prevValue: any
  nextValue: any
}

/**
 * 列表结构事件
 */
export interface StructureEvent {
  kind: 'structure'
  reason: 'add' | 'remove' | 'move' | 'replace'
  added?: Array<{ index: number; rowKey?: string }>
  removed?: Array<{ index: number; rowKey?: string }>
  moves?: Array<{ from: number; to: number; rowKey?: string }>
  reindexedIndices: number[]
  pathMap?: Array<[string, string]> // [oldPath, newPath]
}

/**
 * 订阅处理函数上下文
 */
export interface SubscribeHandlerContext {
  // 触发源
  path: string // 本次触发的具体路径，如 'list.1.field'（触发源）
  target: string // 本订阅注册时的 target，如 'list.*.field'
  subscriberPath: string // 订阅者的具体路径，如 'list.0.name2'（订阅者自己的路径）
  event: ValueEvent | StructureEvent
  match?: {
    pattern: string
    stars: string[] // 通配符匹配的值，如 ['1']
  }
  batchId: string

  // 读取
  getSchema: (path?: string) => any
  getValue: (path?: string) => any
  /** 获取最近一层 list 的当前行对象值 */
  getCurRowValue: () => any
  /** 获取最近一层 list 的当前行索引 */
  getCurRowIndex: () => number

  // 写入
  updateValue: (path: string | Record<string, any>, value?: any) => void
  /** 更新订阅者自己的值（相当于 updateValue(subscriberPath, value)） */
  updateSelf: (value: any) => void
}

// ============================================================================
// 路径相关类型
// ============================================================================

/**
 * 路径匹配结果
 */
export interface PathMatchResult {
  matched: boolean
  stars?: string[] // 通配符匹配的值
}

/**
 * 编译后的路径模式
 */
export interface CompiledPattern {
  pattern: string
  regex: RegExp
  segments: string[]
  wildcardIndices: number[] // 通配符所在的段索引
}

// ============================================================================
// 更新相关类型
// ============================================================================

/**
 * 值变更记录
 */
export interface ValueChange {
  path: string
  prevValue: any
  nextValue: any
}

/**
 * 变更集合
 */
export interface ChangeSet {
  changes: ValueChange[]
}

// ============================================================================
// FormEngine 配置与选项
// ============================================================================

/**
 * FormEngine 初始化选项
 */
export interface FormEngineOptions {
  /** JSON Schema */
  schema: JsonSchemaNode
  /** 初始 FormModel */
  model?: any
  /** 隐藏字段策略：keep 保留值，remove 清除值 */
  hiddenFieldPolicy?: 'keep' | 'remove'
  /** 最大更新深度，防止死循环 */
  maxUpdateDepth?: number
}

/**
 * reset 方法选项
 */
export interface ResetOptions {
  /** 是否保留脏态标记 */
  keepDirty?: boolean
  /** 是否保留触碰标记 */
  keepTouched?: boolean
}

/**
 * onValueChange 监听选项
 */
export interface OnValueChangeOptions {
  /** 路径模式，如 'list.*.field' */
  pattern?: string
  /** 事件类型过滤 */
  kinds?: Array<'value' | 'structure'>
}

// ============================================================================
// 内部辅助类型
// ============================================================================

/**
 * 订阅处理项 (内部)
 */
export interface HandlerItem {
  handler: SubscribeHandler
  debounce?: boolean
  source: {
    subscriberPath: string // 订阅者路径
    target: string // 订阅目标
  }
}

/**
 * 订阅索引 (内部)
 */
export interface SubscribeIndex {
  exact: Map<string, HandlerItem[]> // 精确路径
  pattern: Array<{
    pattern: string
    compiled: CompiledPattern
    handlers: HandlerItem[]
  }>
  relative: Map<
    string,
    Array<{
      ownerPath: string // 所属节点路径
      relativePattern: string
      handlers: HandlerItem[]
    }>
  >
}

/**
 * 计算后的控制属性
 */
export interface ComputedControl {
  required: boolean
  disabled: boolean
  readonly: boolean
  ifShow: boolean
  show: boolean
}

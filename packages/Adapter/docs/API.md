# API 文档

FormAdapter 的完整 API 参考文档。

## FormAdapter 组件

### Props

```typescript
interface Props {
  /**
   * 表单 Schema
   * @required
   */
  schema: FormSchema

  /**
   * 表单数据模型
   * @default {}
   */
  model?: FormModel

  /**
   * 组件定义（数组）或组件预设
   */
  components?: ComponentDefinition[] | ComponentPreset

  /**
   * 配置选项
   */
  options?: {
    // 引擎选项
    engine?: {
      enableUpdateScheduler?: boolean  // 启用更新调度器
    }
    // 事件处理器选项
    eventHandler?: {
      enableBatch?: boolean           // 启用批量更新
      batchDelay?: number             // 批量延迟（毫秒）
    }
    // 渲染选项
    render?: {
      showRequiredAsterisk?: boolean  // 显示必填星号
      labelAlign?: 'left' | 'right' | 'top'
      labelWidth?: string | number
    }
    // FormItem 组件（覆盖预设中的 formItem）
    formItem?: Component
    // 主题配置
    theme?: {
      size?: 'large' | 'default' | 'small'
      classPrefix?: string
    }
  }
}
```

### Events

```typescript
interface Emits {
  /**
   * 数据模型更新
   * 用于 v-model:model 双向绑定
   */
  'update:model': (model: FormModel) => void

  /**
   * 字段值变化
   */
  'change': (event: { path: string; value: any }) => void

  /**
   * 字段失焦
   */
  'field-blur': (event: { path: string; event: FocusEvent }) => void

  /**
   * 字段聚焦
   */
  'field-focus': (event: { path: string; event: FocusEvent }) => void

  /**
   * 列表变化（添加、删除、移动）
   */
  'list-change': (event: {
    path: string
    operation: string
    [key: string]: any
  }) => void

  /**
   * 校验完成
   */
  'validate': (result: ValidationResult) => void

  /**
   * 表单提交
   */
  'submit': (model: FormModel) => void

  /**
   * 初始化完成
   */
  'ready': (engine: ReactiveEngine) => void
}
```

### Methods（通过 ref 访问）

```typescript
interface ExposedMethods {
  // ========== 核心实例访问 ==========
  
  /**
   * 获取 ReactiveEngine 实例
   */
  getEngine: () => ReactiveEngine | undefined

  /**
   * 获取 ComponentRegistry 实例
   */
  getRegistry: () => ComponentRegistry | undefined

  /**
   * 获取 EventHandler 实例
   */
  getEventHandler: () => EventHandler | undefined

  // ========== 数据操作 ==========
  
  /**
   * 获取值
   * @param path - 路径，不传则返回整个 model
   */
  getValue: (path?: string) => any

  /**
   * 更新单个字段值
   */
  updateValue: (path: string, value: any) => void

  /**
   * 批量更新字段值
   */
  updateValues: (values: Record<string, any>) => void

  // ========== 列表操作 ==========
  
  /**
   * 获取列表操作器
   */
  getListOperator: (path: string) => {
    append: (row: any) => void
    insert: (index: number, row: any) => void
    remove: (index: number) => void
    move: (from: number, to: number) => void
    swap: (a: number, b: number) => void
    replace: (index: number, row: any) => void
    clear: () => void
  }

  // ========== 校验 ==========
  
  /**
   * 校验表单
   * @param paths - 可选的路径数组，不传则校验所有字段
   */
  validate: (paths?: string[]) => Promise<ValidationResult>

  // ========== 表单操作 ==========
  
  /**
   * 提交表单（先校验再触发 submit 事件）
   */
  submit: () => Promise<void>

  /**
   * 重置表单（恢复到初始状态）
   */
  reset: () => Promise<void>

  /**
   * 立即刷新所有待处理的更新
   */
  flush: () => void

  // ========== 组件注册 ==========
  
  /**
   * 注册单个组件
   */
  registerComponent: (definition: ComponentDefinition) => void

  /**
   * 批量注册组件
   */
  registerComponents: (definitions: ComponentDefinition[]) => void

  /**
   * 注册组件预设
   */
  registerPreset: (preset: ComponentPreset) => void

  // ========== 工具方法 ==========
  
  /**
   * 滚动到指定字段（预留）
   */
  scrollToField: (path: string) => void

  /**
   * 聚焦到指定字段（预留）
   */
  focusField: (path: string) => void

  // ========== 生命周期 ==========
  
  /**
   * 销毁组件
   */
  destroy: () => void
}
```

### 使用示例

```vue
<template>
  <FormAdapter
    ref="formRef"
    :schema="schema"
    v-model:model="formData"
    :components="ElementPlusPreset"
    :options="options"
    @change="handleChange"
    @submit="handleSubmit"
    @ready="handleReady"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FormAdapter } from '@form-renderer/adapter-vue3'

const formRef = ref()
const formData = ref({ name: '', age: 0 })

const options = {
  engine: {
    enableUpdateScheduler: true
  },
  eventHandler: {
    enableBatch: true,
    batchDelay: 16
  }
}

const handleChange = (event) => {
  console.log('值变化:', event)
}

const handleSubmit = async (data) => {
  console.log('提交:', data)
}

const handleReady = (engine) => {
  console.log('引擎已就绪:', engine)
}

// 调用方法
const validate = async () => {
  const result = await formRef.value.validate()
  console.log('校验结果:', result)
}

const reset = () => {
  formRef.value.reset()
}

const updateField = () => {
  formRef.value.updateValue('name', 'John')
}
</script>
```

## useFormAdapter

编程式的表单管理 Composable。

### 参数

```typescript
interface UseFormAdapterOptions {
  /**
   * 表单 Schema
   * @required
   */
  schema: FormSchema

  /**
   * 表单数据
   */
  model?: FormModel

  /**
   * 组件定义或预设
   */
  components?: ComponentDefinition[] | ComponentPreset

  /**
   * 引擎配置
   */
  engineOptions?: Partial<ReactiveEngineOptions>

  /**
   * 事件处理器配置
   */
  eventHandlerOptions?: EventHandlerOptions

  /**
   * 初始化完成回调
   */
  onReady?: (engine: ReactiveEngine) => void

  /**
   * 值变化回调
   */
  onChange?: (event: { path: string; value: any }) => void

  /**
   * 校验完成回调
   */
  onValidate?: (result: ValidationResult) => void

  /**
   * 提交回调
   */
  onSubmit?: (model: FormModel) => Promise<void> | void
}
```

### 返回值

```typescript
interface UseFormAdapterReturn {
  // ========== 状态（只读） ==========
  
  /**
   * ReactiveEngine 实例
   */
  engine: Readonly<Ref<ReactiveEngine | undefined>>

  /**
   * ComponentRegistry 实例
   */
  registry: Readonly<Ref<ComponentRegistry | undefined>>

  /**
   * EventHandler 实例
   */
  eventHandler: Readonly<Ref<EventHandler | undefined>>

  /**
   * 渲染 Schema（计算属性）
   */
  renderSchema: ComputedRef<RenderSchema | undefined>

  /**
   * 表单数据模型（计算属性）
   */
  model: ComputedRef<FormModel | undefined>

  /**
   * 加载状态
   */
  loading: Readonly<Ref<boolean>>

  /**
   * 校验错误
   */
  errors: Readonly<Ref<ValidationErrors | undefined>>

  // ========== 方法 ==========
  
  /**
   * 初始化（自动在 onMounted 时调用）
   */
  init: () => Promise<void>

  /**
   * 获取值
   */
  getValue: (path?: string) => any

  /**
   * 更新单个字段值
   */
  updateValue: (path: string, value: any) => void

  /**
   * 批量更新字段值
   */
  updateValues: (values: Record<string, any>) => void

  /**
   * 校验表单
   */
  validate: (paths?: string[]) => Promise<ValidationResult>

  /**
   * 提交表单
   */
  submit: () => Promise<void>

  /**
   * 重置表单
   */
  reset: () => void

  /**
   * 销毁
   */
  destroy: () => void

  /**
   * 注册单个组件
   */
  registerComponent: (def: ComponentDefinition) => void

  /**
   * 批量注册组件
   */
  registerComponents: (defs: ComponentDefinition[]) => void

  /**
   * 注册组件预设
   */
  registerPreset: (preset: ComponentPreset) => void

  /**
   * 获取列表操作器
   */
  getListOperator: (path: string) => ListOperator | undefined
}
```

### 使用示例

```typescript
import { useFormAdapter } from '@form-renderer/adapter-vue3'
import { ElementPlusPreset } from '@form-renderer/adapter-vue3/presets'

const {
  renderSchema,
  model,
  loading,
  errors,
  getValue,
  updateValue,
  validate,
  submit,
  reset
} = useFormAdapter({
  schema: {
    type: 'form',
    properties: {
      name: {
        type: 'field',
        component: 'Input',
        required: true
      }
    }
  },
  model: { name: '' },
  components: ElementPlusPreset,
  onSubmit: async (data) => {
    await api.submitForm(data)
  }
})

// 使用状态
console.log('渲染 Schema:', renderSchema.value)
console.log('表单数据:', model.value)
console.log('加载中:', loading.value)
console.log('错误:', errors.value)

// 调用方法
updateValue('name', 'John')
const result = await validate()
await submit()
reset()
```

## ReactiveEngine

响应式引擎，将 FormEngine 与 Vue3 响应式系统集成。

### 构造函数

```typescript
interface ReactiveEngineOptions {
  /**
   * 表单 Schema
   * @required
   */
  schema: FormSchema

  /**
   * 初始数据模型
   */
  model?: FormModel

  /**
   * 是否启用更新调度器
   * @default false
   */
  enableUpdateScheduler?: boolean
}

// 创建实例
const engine = new ReactiveEngine(options)

// 或使用工厂函数
const engine = createReactiveEngine(options)
```

### 实例方法

```typescript
class ReactiveEngine {
  /**
   * 获取响应式的渲染 Schema（只读）
   */
  getRenderSchema(): DeepReadonly<ShallowRef<RenderSchema>>

  /**
   * 获取响应式的数据模型（只读）
   */
  getModel(): DeepReadonly<ShallowRef<FormModel>>

  /**
   * 获取原始 FormEngine 实例
   */
  getEngine(): FormEngine

  /**
   * 更新值（支持单个更新和批量更新）
   */
  updateValue(path: string, value: any): void
  updateValue(updates: Record<string, any>): void

  /**
   * 立即刷新所有待处理的更新（仅在启用调度器时有效）
   */
  flush(): void

  /**
   * 设置表单 Schema
   */
  setFormSchema(schema: FormSchema): void

  /**
   * 重置表单（恢复到初始状态）
   */
  reset(): void

  /**
   * 清空表单值（保持当前结构）
   */
  clear(): void

  /**
   * 校验表单
   */
  validate(paths?: string[]): Promise<ValidationResult>

  /**
   * 获取列表操作器
   */
  getListOperator(path: string): {
    append: (row: any) => void
    insert: (index: number, row: any) => void
    remove: (index: number) => void
    move: (from: number, to: number) => void
    swap: (a: number, b: number) => void
    replace: (index: number, row: any) => void
    clear: () => void
  }

  /**
   * 销毁引擎，清理所有订阅
   */
  destroy(): void

  /**
   * 检查引擎是否已销毁
   */
  get destroyed(): boolean
}
```

### 使用示例

```typescript
import { createReactiveEngine } from '@form-renderer/adapter-vue3'

const engine = createReactiveEngine({
  schema: mySchema,
  model: { name: '', age: 0 },
  enableUpdateScheduler: true
})

// 获取响应式数据（只读）
const renderSchema = engine.getRenderSchema()
const model = engine.getModel()

// 在 Vue 组件中使用
watch(() => renderSchema.value, (newSchema) => {
  console.log('Schema 更新:', newSchema)
})

watch(() => model.value, (newModel) => {
  console.log('Model 更新:', newModel)
}, { deep: true })

// 更新值
engine.updateValue('name', 'John')

// 批量更新
engine.updateValue({
  name: 'John',
  age: 25
})

// 列表操作
const listOp = engine.getListOperator('items')
listOp.append({ name: 'Item 1' })
listOp.remove(0)

// 校验
const result = await engine.validate()

// 销毁
engine.destroy()
```

## ComponentRegistry

组件注册中心，管理所有可用的组件定义。

### 实例方法

```typescript
class ComponentRegistry {
  /**
   * 注册单个组件
   */
  register(definition: ComponentDefinition): void

  /**
   * 批量注册组件
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
   * 按类型获取所有组件
   */
  getByType(type: ComponentType): ComponentDefinition[]

  /**
   * 注册组件预设
   */
  registerPreset(preset: ComponentPreset): void

  /**
   * 获取所有已注册的组件名称
   */
  getRegisteredNames(): string[]

  /**
   * 获取所有已注册的组件定义
   */
  getAll(): ComponentDefinition[]

  /**
   * 清空所有注册的组件
   */
  clear(): void

  /**
   * 注销单个组件
   */
  unregister(name: string): boolean

  /**
   * 克隆注册表
   */
  clone(): ComponentRegistry

  /**
   * 合并另一个注册表
   */
  merge(other: ComponentRegistry, overwrite?: boolean): void

  /**
   * 获取注册表统计信息
   */
  getStats(): {
    total: number
    byType: Record<ComponentType, number>
  }
}
```

### 使用示例

```typescript
import { createComponentRegistry } from '@form-renderer/adapter-vue3'

const registry = createComponentRegistry()

// 注册单个组件
registry.register({
  name: 'Input',
  component: MyInput,
  type: 'field',
  eventMapping: {
    onChange: 'update:modelValue'
  }
})

// 批量注册
registry.registerBatch([
  { name: 'Input', component: MyInput, type: 'field' },
  { name: 'Select', component: MySelect, type: 'field' }
])

// 注册预设
registry.registerPreset(ElementPlusPreset)

// 获取组件
const inputDef = registry.get('Input')
console.log(inputDef)

// 检查组件是否存在
if (registry.has('Input')) {
  console.log('Input 组件已注册')
}

// 按类型获取
const fieldComponents = registry.getByType('field')

// 获取统计信息
const stats = registry.getStats()
console.log('总共注册了', stats.total, '个组件')
console.log('字段组件:', stats.byType.field, '个')
```

## EventHandler

事件处理器，负责处理所有用户交互事件。

### 构造函数

```typescript
interface EventHandlerOptions {
  /**
   * 是否启用批量更新
   * @default false
   */
  enableBatch?: boolean

  /**
   * 批量更新延迟（毫秒）
   * @default 16
   */
  batchDelay?: number

  /**
   * 值转换错误处理
   */
  onTransformError?: (error: Error, path: string, value: any) => void

  /**
   * 更新错误处理
   */
  onUpdateError?: (error: Error, path: string, value: any) => void
}

// 创建实例
const handler = new EventHandler(engine, registry, options)

// 或使用工厂函数
const handler = createEventHandler(engine, registry, options)
```

### 实例方法

```typescript
class EventHandler {
  /**
   * 处理字段值变化
   */
  handleFieldChange(path: string, value: any, componentName: string): void

  /**
   * 处理字段聚焦
   */
  handleFieldFocus(path: string, event?: FocusEvent): void

  /**
   * 处理字段失焦
   */
  handleFieldBlur(path: string, event?: FocusEvent): void

  /**
   * 处理列表添加行
   */
  handleListAdd(path: string, defaultRow?: any): void

  /**
   * 处理列表删除行
   */
  handleListRemove(path: string, index: number): void

  /**
   * 处理列表移动行
   */
  handleListMove(path: string, from: number, to: number): void

  /**
   * 处理列表插入行
   */
  handleListInsert(path: string, index: number, row?: any): void

  /**
   * 批量更新多个字段
   */
  batchUpdate(updates: Array<{
    path: string
    value: any
    component?: string
  }>): void

  /**
   * 立即刷新所有待处理的批量更新
   */
  flush(): void

  /**
   * 销毁事件处理器
   */
  destroy(): void
}
```

### 使用示例

```typescript
import { createEventHandler } from '@form-renderer/adapter-vue3'

const handler = createEventHandler(engine, registry, {
  enableBatch: true,
  batchDelay: 16,
  onTransformError: (error, path, value) => {
    console.error('值转换错误:', error, path, value)
  }
})

// 处理字段变化
handler.handleFieldChange('name', 'John', 'Input')

// 处理聚焦/失焦
handler.handleFieldFocus('name', focusEvent)
handler.handleFieldBlur('name', blurEvent)

// 处理列表操作
handler.handleListAdd('items', { name: '', price: 0 })
handler.handleListRemove('items', 0)
handler.handleListMove('items', 0, 1)

// 批量更新
handler.batchUpdate([
  { path: 'name', value: 'John', component: 'Input' },
  { path: 'age', value: 25, component: 'InputNumber' }
])

// 立即刷新
handler.flush()

// 销毁
handler.destroy()
```

## 类型定义

### ComponentDefinition

```typescript
interface ComponentDefinition<T = any> {
  /**
   * 组件名称（唯一标识）
   * @required
   */
  name: string

  /**
   * Vue 组件
   * @required
   */
  component: Component

  /**
   * 组件类型
   * @required
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
   * @default true（field 类型）
   */
  needFormItem?: boolean

  /**
   * 自定义渲染逻辑
   */
  customRender?: (props: RenderProps) => VNode
}
```

### ComponentPreset

```typescript
interface ComponentPreset {
  /**
   * 预设名称
   * @required
   */
  name: string

  /**
   * 组件定义列表
   * @required
   */
  components: ComponentDefinition[]

  /**
   * 表单项包装组件（如 UI 库的 FormItem）
   */
  formItem?: Component

  /**
   * Rule 转换器（可选）
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
```

### ValueTransformer

```typescript
interface ValueTransformer<T = any, U = any> {
  /**
   * 引擎值转组件值
   * @param engineValue - 引擎中的值
   * @returns 组件使用的值
   */
  toComponent: (engineValue: T) => U

  /**
   * 组件值转引擎值
   * @param componentValue - 组件的值
   * @returns 引擎中存储的值
   */
  fromComponent: (componentValue: U) => T
}
```

### EventMapping

```typescript
interface EventMapping {
  /**
   * 值变化事件
   * @default 'update:modelValue'
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
```

### RuleConverter

```typescript
/**
 * Rule 转换器类型
 * 将 Engine 的 validators 转换为 UI 框架特定的 rules 格式
 */
type RuleConverter = (
  node: RenderNode,
  computed: Record<string, any>,
  context: RenderContext
) => any[]
```

### RenderContext

```typescript
interface RenderContext {
  /**
   * ReactiveEngine 实例
   */
  engine: ReactiveEngine

  /**
   * 组件注册表
   */
  registry: ComponentRegistry

  /**
   * 事件处理器
   */
  eventHandler?: EventHandler

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
   * Rule 转换器
   */
  ruleConverter?: RuleConverter

  /**
   * 配置选项
   */
  options?: any
}
```

### ValidationResult

```typescript
// 校验成功
type ValidationResult = true

// 校验失败
interface ValidationResult {
  ok: false
  errors: Array<{
    path: string
    message: string
    code?: string
  }>
  errorByPath: Record<string, Array<{
    message: string
    code?: string
  }>>
}
```

## 工具函数

### defineFieldComponent

定义字段组件的辅助函数。

```typescript
function defineFieldComponent(options: DefineFieldOptions): ComponentDefinition
```

### defineLayoutComponent

定义布局组件的辅助函数。

```typescript
function defineLayoutComponent(
  name: string,
  component: Component,
  defaultProps?: Record<string, any>
): ComponentDefinition
```

### defineListComponent

定义列表组件的辅助函数。

```typescript
function defineListComponent(
  name: string,
  component: Component,
  defaultProps?: Record<string, any>
): ComponentDefinition
```

### 标准化函数

```typescript
/**
 * 标准化单个组件定义
 */
function normalizeComponent(
  definition: ComponentDefinition,
  options?: NormalizeOptions
): ComponentDefinition

/**
 * 批量标准化组件定义
 */
function normalizeComponents(
  definitions: ComponentDefinition[],
  options?: NormalizeOptions
): ComponentDefinition[]
```

## 常见模式

### 自定义组件注册

```typescript
registry.register({
  name: 'MyInput',
  component: MyInputComponent,
  type: 'field',
  defaultProps: {
    clearable: true,
    size: 'default'
  },
  valueTransformer: {
    toComponent: (v) => v || '',
    fromComponent: (v) => v.trim()
  },
  eventMapping: {
    onChange: 'update:modelValue',
    onBlur: 'blur'
  },
  needFormItem: true
})
```

### 动态注册组件

```typescript
const formRef = ref()

onMounted(() => {
  // 动态注册组件
  formRef.value.registerComponent({
    name: 'CustomWidget',
    component: CustomWidgetComponent,
    type: 'field'
  })
})
```

### 访问底层 Engine

```typescript
const formRef = ref()

// 获取 ReactiveEngine
const engine = formRef.value.getEngine()

// 访问原始 FormEngine
const rawEngine = engine.getEngine()

// 调用 FormEngine 方法
const schema = rawEngine.getSchema('name')
```

### 自定义校验规则转换

```typescript
const myRuleConverter: RuleConverter = (node, computed, context) => {
  const rules = []

  // 必填校验
  if (computed.required) {
    rules.push({
      required: true,
      message: '必填项',
      trigger: 'blur'
    })
  }

  // 自定义校验器
  if (node.validators) {
    node.validators.forEach((validator) => {
      rules.push({
        validator: async (rule, value, callback) => {
          const ctx = {
            path: node.path,
            getSchema: context.engine.getEngine().getSchema,
            getValue: context.engine.getEngine().getValue,
            getCurRowValue: () => ({}),
            getCurRowIndex: () => -1
          }
          const result = await validator(value, ctx)
          if (typeof result === 'string') {
            callback(new Error(result))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      })
    })
  }

  return rules
}
```

## 错误处理

### TransformError

值转换错误。

```typescript
class TransformError extends Error {
  name: 'TransformError'
  componentName: string
  value: any
}
```

### 捕获错误

```typescript
const handler = createEventHandler(engine, registry, {
  onTransformError: (error, path, value) => {
    console.error('值转换失败:', {
      error,
      path,
      value,
      component: error.componentName
    })
    // 上报错误
    reportError(error)
  },
  onUpdateError: (error, path, value) => {
    console.error('更新失败:', { error, path, value })
    // 显示错误提示
    showErrorNotification(error.message)
  }
})
```

## 最佳实践

### 1. 组件定义

```typescript
// ✅ 推荐：使用完整的类型定义
const inputDef: ComponentDefinition = {
  name: 'Input',
  component: ElInput,
  type: 'field',
  defaultProps: {
    clearable: true
  },
  eventMapping: {
    onChange: 'update:modelValue'
  }
}

// ❌ 不推荐：缺少类型
const inputDef = {
  name: 'Input',
  component: ElInput
}
```

### 2. 值转换器

```typescript
// ✅ 推荐：处理边界情况
const dateTransformer: ValueTransformer = {
  toComponent: (v) => (v ? new Date(v) : null),
  fromComponent: (v) => (v ? v.toISOString() : '')
}

// ❌ 不推荐：不处理空值
const dateTransformer = {
  toComponent: (v) => new Date(v),  // v 为空时会报错
  fromComponent: (v) => v.toISOString()
}
```

### 3. 事件处理

```typescript
// ✅ 推荐：使用具名方法
const handleChange = (event) => {
  console.log('值变化:', event)
}

<FormAdapter @change="handleChange" />

// ❌ 不推荐：使用内联函数
<FormAdapter @change="(e) => console.log(e)" />
```


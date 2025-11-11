# 项目结构

FormAdapter 的项目结构和模块组织说明。

## 目录结构

```
packages/Adapter/
├── src/                          # 源代码
│   ├── index.ts                  # 主入口文件
│   ├── types.ts                  # 类型定义
│   ├── components/               # 组件层
│   │   ├── FormAdapter.vue       # 主组件（入口）
│   │   ├── SchemaRenderer.vue    # Schema 渲染器
│   │   ├── index.ts              # 组件导出
│   │   ├── containers/           # 容器组件
│   │   │   ├── FormContainer.vue     # 表单容器
│   │   │   ├── LayoutContainer.vue   # 布局容器
│   │   │   └── ListContainer.vue     # 列表容器
│   │   └── wrappers/             # 包装组件
│   │       └── FieldWrapper.vue      # 字段包装器
│   ├── core/                     # 核心模块
│   │   ├── index.ts              # 核心模块导出
│   │   ├── ReactiveEngine.ts     # 响应式引擎
│   │   ├── ComponentRegistry.ts  # 组件注册表
│   │   ├── EventHandler.ts       # 事件处理器
│   │   ├── UpdateScheduler.ts    # 更新调度器
│   │   └── ComponentNormalizer.ts # 组件标准化
│   ├── composables/              # 组合式函数
│   │   ├── index.ts              # Composables 导出
│   │   ├── useFormAdapter.ts     # 表单适配器
│   │   └── useFieldComponent.ts  # 字段组件
│   ├── utils/                    # 工具函数
│   │   ├── index.ts              # 工具导出
│   │   ├── batch.ts              # 批量更新工具
│   │   ├── common.ts             # 通用工具
│   │   ├── component.ts          # 组件工具
│   │   ├── performance.ts        # 性能工具
│   │   ├── reactive.ts           # 响应式工具
│   │   └── validation-helpers.ts # 校验辅助
│   ├── presets/                  # 预设集成
│   │   ├── index.ts              # 预设导出
│   │   ├── README.md             # 预设开发指南
│   │   ├── template/             # 预设模板
│   │   │   └── preset-template.ts
│   │   ├── example/              # 示例预设
│   │   │   ├── index.ts
│   │   │   └── components/
│   │   └── element-plus/         # Element Plus 预设
│   │       ├── index.ts
│   │       └── components/
│   └── dev/                      # 开发工具
│       ├── index.ts              # 开发工具导出
│       └── BaseFieldAdapter.ts   # 基础字段适配器
├── tests/                        # 测试文件
│   ├── setup.ts                  # 测试配置
│   ├── unit/                     # 单元测试
│   │   ├── core/                 # 核心模块测试
│   │   └── utils/                # 工具函数测试
│   └── integration/              # 集成测试
├── docs/                         # 文档
│   ├── API.md                    # API 文档
│   ├── PROJECT_STRUCTURE.md      # 项目结构
│   ├── COMPONENT_PRESET.md       # 组件预设开发指南
│   └── REACTIVE_ENGINE.md        # 响应式引擎详解
├── examples/                     # 示例
│   ├── basic.vue                 # 基础示例
│   └── performance-demo.vue      # 性能演示
├── package.json                  # 包配置
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 配置
├── vitest.config.ts              # Vitest 配置
└── README.md                     # 项目说明
```

## 模块职责

### 1. 组件层（components/）

#### FormAdapter.vue
**主组件，整个 Adapter 的入口。**

职责：
- 接收 Schema、Model 和组件配置
- 初始化核心模块（ReactiveEngine、ComponentRegistry、EventHandler）
- 提供对外 API（ref 暴露）
- 管理生命周期
- 处理事件分发

关键代码：
```vue
<script setup lang="ts">
// 核心模块初始化
const reactiveEngine = shallowRef<ReactiveEngine>()
const componentRegistry = shallowRef<ComponentRegistry>()
const eventHandler = shallowRef<EventHandler>()

// 对外暴露的 API
defineExpose({
  getEngine,
  getValue,
  updateValue,
  validate,
  submit,
  reset,
  // ...
})
</script>
```

#### SchemaRenderer.vue
**Schema 渲染器，负责递归渲染 RenderNode 树。**

职责：
- 根据 RenderNode 类型选择对应的容器组件
- 传递 RenderContext 给子组件
- 处理渲染路径和深度
- 触发事件冒泡

关键逻辑：
```typescript
// 根据节点类型选择容器
if (node.type === 'form') {
  return <FormContainer />
} else if (node.type === 'layout') {
  return <LayoutContainer />
} else if (node.type === 'list') {
  return <ListContainer />
} else if (node.type === 'field') {
  return <FieldWrapper />
}
```

#### 容器组件（containers/）

**FormContainer.vue**
- 渲染表单根节点
- 集成 UI 框架的 Form 组件（如 `<el-form>`）
- 管理表单级别的配置（labelWidth、labelAlign 等）

**LayoutContainer.vue**
- 渲染布局节点
- 支持自定义布局组件
- 处理 `ifShow` 控制显示/隐藏

**ListContainer.vue**
- 渲染列表节点
- 提供列表操作按钮（添加、删除、移动）
- 管理列表项的渲染
- 集成 UI 框架的 List 组件

#### FieldWrapper.vue
**字段包装器，负责渲染单个字段。**

职责：
- 从 ComponentRegistry 获取组件定义
- 应用 FormItem 包裹（如果需要）
- 处理值转换（ValueTransformer）
- 绑定事件（EventMapping）
- 处理控制属性（disabled、readonly 等）
- 转换校验规则（RuleConverter）

关键逻辑：
```typescript
// 获取组件定义
const definition = registry.get(node.component)

// 应用值转换器
const componentValue = definition.valueTransformer?.toComponent(engineValue)

// 绑定事件
const handleChange = (value) => {
  const engineValue = definition.valueTransformer?.fromComponent(value)
  emit('field-change', { path, value: engineValue, component: node.component })
}
```

### 2. 核心模块（core/）

#### ReactiveEngine.ts
**响应式引擎，将 FormEngine 与 Vue3 响应式系统集成。**

职责：
- 创建和管理 FormEngine 实例
- 使用 `shallowRef` 包装 renderSchema 和 model
- 监听 FormEngine 的值变化和结构变化事件
- 自动更新响应式引用
- 提供只读的响应式数据访问
- 管理更新调度器（可选）

关键设计：
```typescript
class ReactiveEngine {
  private engine: FormEngine
  private renderSchemaRef: ShallowRef<RenderSchema>
  private modelRef: ShallowRef<FormModel>
  private updateScheduler?: UpdateScheduler

  // 监听值变化
  private handleValueChange(event: ValueChangeEvent): void {
    // Engine 已采用不可变更新，直接获取新引用
    this.modelRef.value = this.engine.getValue()
    this.renderSchemaRef.value = this.engine.getRenderSchema()
  }

  // 监听结构变化
  private handleStructureChange(): void {
    // 列表操作后，重新获取引用
    this.renderSchemaRef.value = this.engine.getRenderSchema()
    this.modelRef.value = this.engine.getValue()
  }
}
```

**为什么使用 shallowRef？**
- `shallowRef` 只追踪引用变化，不追踪内部属性
- FormEngine 已经采用不可变更新，每次更新都会返回新引用
- 避免深度响应式的性能开销
- 配合结构共享，未改变的节点复用引用

#### ComponentRegistry.ts
**组件注册中心，管理所有可用的组件定义。**

职责：
- 提供单个注册、批量注册、预设注册
- 验证组件定义的有效性
- 按名称或类型查找组件
- 支持注册表克隆和合并
- 提供统计信息

关键方法：
```typescript
class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map()

  // 注册单个组件
  register(definition: ComponentDefinition): void {
    this.validateDefinition(definition)
    this.components.set(definition.name, definition)
  }

  // 注册预设
  registerPreset(preset: ComponentPreset): void {
    if (preset.setup) {
      preset.setup()  // 执行初始化
    }
    this.registerBatch(preset.components)
  }
}
```

#### EventHandler.ts
**事件处理器，负责处理所有用户交互事件。**

职责：
- 处理字段值变化事件
- 处理聚焦/失焦事件
- 处理列表操作事件（添加、删除、移动）
- 应用值转换器
- 支持批量更新优化
- 统一的错误处理

关键方法：
```typescript
class EventHandler {
  // 处理字段变化
  handleFieldChange(path: string, value: any, componentName: string): void {
    // 1. 获取组件定义
    const definition = this.registry.get(componentName)
    
    // 2. 应用值转换器
    const engineValue = definition.valueTransformer?.fromComponent(value) ?? value
    
    // 3. 更新引擎（支持批量）
    if (this.batchManager) {
      this.batchManager.scheduleUpdate(path, engineValue)
    } else {
      this.engine.updateValue(path, engineValue)
    }
  }

  // 处理列表添加
  handleListAdd(path: string, defaultRow?: any): void {
    const listOperator = this.engine.getListOperator(path)
    listOperator.append(defaultRow ?? {})
  }
}
```

#### UpdateScheduler.ts
**更新调度器，负责批量收集和调度更新。**

职责：
- 使用 `requestAnimationFrame` 调度更新
- 合并多个连续更新为一次批量更新
- 支持立即刷新
- 执行更新后的回调

关键逻辑：
```typescript
class UpdateScheduler {
  private pendingUpdates: Map<string, any> = new Map()
  private timer: number | null = null

  scheduleUpdate(path: string, value: any): void {
    this.pendingUpdates.set(path, value)

    if (!this.timer) {
      this.timer = requestAnimationFrame(() => {
        this.flush()
      })
    }
  }

  flush(): void {
    const updates = Object.fromEntries(this.pendingUpdates)
    this.pendingUpdates.clear()
    this.engine.updateValue(updates)
  }
}
```

#### ComponentNormalizer.ts
**组件标准化工具，负责规范化组件定义。**

职责：
- 填充默认值
- 标准化事件映射
- 应用通用属性包装
- 提供便捷的定义函数

工具函数：
```typescript
// 定义字段组件
function defineFieldComponent(options: DefineFieldOptions): ComponentDefinition

// 定义布局组件
function defineLayoutComponent(name, component, defaultProps): ComponentDefinition

// 定义列表组件
function defineListComponent(name, component, defaultProps): ComponentDefinition

// 标准化组件
function normalizeComponent(definition, options): ComponentDefinition
```

### 3. 组合式函数（composables/）

#### useFormAdapter.ts
**表单适配器 Composable，提供编程式的表单管理能力。**

职责：
- 初始化核心模块
- 提供响应式的状态（renderSchema、model、loading、errors）
- 提供表单操作方法（getValue、updateValue、validate、submit、reset）
- 管理生命周期（onMounted 初始化、onBeforeUnmount 销毁）
- 触发用户回调（onReady、onChange、onValidate、onSubmit）

使用场景：
- 不使用 `<FormAdapter>` 组件，完全编程式控制
- 需要更灵活的表单管理
- 自定义渲染逻辑

#### useFieldComponent.ts
**字段组件开发辅助 Composable。**

职责：
- 提供字段组件开发的标准接口
- 简化 props 和 emits 定义
- 提供常用的工具函数

使用场景：
- 开发自定义字段组件
- 统一字段组件的开发规范

### 4. 工具函数（utils/）

#### batch.ts
**批量更新管理器。**

```typescript
class BatchUpdateManager {
  private updates: UpdateItem[] = []
  private timer: NodeJS.Timeout | null = null
  private flushCallback: (updates: UpdateItem[]) => void

  scheduleUpdate(path: string, value: any): void {
    this.updates.push({ path, value })
    this.scheduleBatch()
  }

  private scheduleBatch(): void {
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.flush()
    }, this.delay)
  }

  flush(): void {
    if (this.updates.length === 0) return
    const updates = [...this.updates]
    this.updates = []
    this.flushCallback(updates)
  }
}
```

#### common.ts
**通用工具函数。**

```typescript
// 深克隆
function deepClone<T>(obj: T): T

// 深度合并
function deepMerge(target: any, source: any): any

// 路径解析
function parsePath(path: string): string[]

// 路径连接
function joinPath(...parts: string[]): string

// 判断是否为空值
function isEmpty(value: any): boolean

// 判断是否为对象
function isObject(value: any): boolean

// 判断是否为数组
function isArray(value: any): boolean
```

#### component.ts
**组件相关工具函数。**

```typescript
// 包装组件属性
function wrapComponentProps(props: any, definition: ComponentDefinition): any

// 应用默认属性
function applyDefaultProps(props: any, defaults: any): any

// 提取组件事件
function extractComponentEvents(definition: ComponentDefinition): string[]

// 创建事件处理器
function createEventHandlers(definition: ComponentDefinition, emit: any): Record<string, Function>
```

#### performance.ts
**性能优化工具。**

```typescript
// 节流
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T

// 防抖
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T

// 性能标记
function mark(name: string): void

// 性能测量
function measure(name: string, startMark: string, endMark: string): void

// RAF 调度
function scheduleRAF(fn: () => void): number

// 取消 RAF
function cancelRAF(id: number): void
```

#### reactive.ts
**响应式工具。**

```typescript
// 创建浅响应式引用
function createShallowReactive<T>(value: T): ShallowRef<T>

// 判断是否为响应式对象
function isReactive(value: any): boolean

// 判断是否为 Ref
function isRef(value: any): boolean

// 解包 Ref
function unref<T>(ref: T | Ref<T>): T

// 转换为只读
function toReadonly<T>(value: T): DeepReadonly<T>
```

#### validation-helpers.ts
**校验辅助函数。**

```typescript
// 必填校验
function requiredValidator(value: any): boolean

// 长度校验
function lengthValidator(value: string, min: number, max: number): boolean

// 正则校验
function patternValidator(value: string, pattern: RegExp): boolean

// 邮箱校验
function emailValidator(value: string): boolean

// 手机号校验
function phoneValidator(value: string): boolean

// 身份证号校验
function idCardValidator(value: string): boolean
```

### 5. 预设集成（presets/）

#### 预设结构

每个预设包含：
- 组件定义列表（components）
- FormItem 组件（formItem）
- Rule 转换器（ruleConverter）
- 主题配置（theme）
- 初始化函数（setup）

#### 预设开发流程

1. **创建预设文件**

```typescript
// presets/my-ui/index.ts
import type { ComponentPreset } from '../../types'

export const MyUIPreset: ComponentPreset = {
  name: 'my-ui',
  components: [
    // 组件定义
  ],
  formItem: MyFormItem,
  ruleConverter: myRuleConverter,
  theme: {
    size: 'default',
    classPrefix: 'my-ui-'
  },
  setup: () => {
    // 初始化逻辑（如全局样式）
  }
}
```

2. **定义组件**

```typescript
const components: ComponentDefinition[] = [
  {
    name: 'Input',
    component: MyInput,
    type: 'field',
    defaultProps: {
      clearable: true
    },
    eventMapping: {
      onChange: 'update:modelValue'
    },
    needFormItem: true
  },
  {
    name: 'Select',
    component: MySelect,
    type: 'field',
    eventMapping: {
      onChange: 'change'
    }
  }
]
```

3. **实现 RuleConverter**

```typescript
const myRuleConverter: RuleConverter = (node, computed, context) => {
  const rules = []

  // 必填
  if (computed.required) {
    rules.push({
      required: true,
      message: '必填项'
    })
  }

  // 自定义校验器
  if (node.validators) {
    // 转换为 UI 框架的格式
  }

  return rules
}
```

详见：[组件预设开发指南](./COMPONENT_PRESET.md)

### 6. 开发工具（dev/）

#### BaseFieldAdapter.ts
**基础字段适配器，用于快速开发字段组件。**

```typescript
class BaseFieldAdapter {
  static adapt(component: Component, options?: {
    defaultProps?: Record<string, any>
    valueTransformer?: ValueTransformer
    eventMapping?: EventMapping
  }): ComponentDefinition {
    return {
      name: component.name,
      component,
      type: 'field',
      ...options
    }
  }
}
```

## 数据流

### 初始化流程

```
用户代码
  ↓
FormAdapter 组件初始化
  ↓
1. 创建 ComponentRegistry
   → 注册组件/预设
  ↓
2. 创建 ReactiveEngine
   → 创建 FormEngine
   → 创建响应式引用（shallowRef）
   → 监听值变化和结构变化事件
  ↓
3. 创建 EventHandler
   → 连接 ReactiveEngine 和 ComponentRegistry
   → 创建 BatchUpdateManager（可选）
  ↓
4. 触发 ready 事件
```

### 值更新流程

```
用户交互（如输入框输入）
  ↓
组件触发 update:modelValue 事件
  ↓
FieldWrapper 捕获事件
  → 应用 ValueTransformer.fromComponent
  ↓
emit('field-change', { path, value, component })
  ↓
SchemaRenderer 冒泡事件
  ↓
FormAdapter 处理事件
  → EventHandler.handleFieldChange
    → 应用值转换器
    → 更新 ReactiveEngine
      → 更新 FormEngine
        → 不可变更新 model
        → 触发订阅
        → 重算控制属性
        → 触发 onValueChange 回调
      → 更新响应式引用
        this.modelRef.value = newModel
        this.renderSchemaRef.value = newRenderSchema
  ↓
Vue 响应式系统检测到变化
  ↓
重新渲染受影响的组件
```

### 列表操作流程

```
用户点击"添加"按钮
  ↓
ListContainer 触发事件
  ↓
SchemaRenderer 冒泡事件
  ↓
FormAdapter 处理事件
  → EventHandler.handleListAdd
    → ReactiveEngine.getListOperator
      → FormEngine.listAppend
        → 不可变更新 model（追加数组项）
        → 重建 renderNode 的 children
        → 触发 StructureEvent
        → 触发订阅
        → 重算控制属性
      → 更新响应式引用
        this.renderSchemaRef.value = newRenderSchema
        this.modelRef.value = newModel
  ↓
Vue 响应式系统检测到变化
  ↓
重新渲染列表（新增行）
```

### 校验流程

```
用户调用 validate()
  ↓
FormAdapter.validate()
  ↓
判断是否有 ruleConverter
  ├─ 有 → 使用 UI 框架的校验
  │   → 获取 UI 表单实例（如 el-form）
  │   → 调用 UI 表单的 validate() 方法
  │   → 转换错误格式为 ValidationResult
  │
  └─ 无 → 使用 Engine 的校验
      → ReactiveEngine.validate()
        → FormEngine.validate()
          → 过滤隐藏和禁用字段
          → 检查 required
          → 执行 validators
          → 返回 ValidationResult
  ↓
触发 validate 事件
  ↓
返回校验结果
```

## 性能优化策略

### 1. 浅响应式

使用 `shallowRef` 而非 `ref`，只追踪引用变化，不追踪内部属性变化。

```typescript
// ✅ 好
const renderSchema = shallowRef(engine.getRenderSchema())

// ❌ 差
const renderSchema = ref(engine.getRenderSchema())
```

### 2. 结构共享

FormEngine 使用不可变更新，未改变的节点复用引用。ReactiveEngine 直接使用这些引用。

```typescript
// Engine 返回新引用
const newRenderNode = engine.getRenderSchema()

// ReactiveEngine 直接赋值
this.renderSchemaRef.value = newRenderNode

// 未改变的子节点引用相同，Vue 跳过重新渲染
```

### 3. 批量更新

使用 UpdateScheduler 和 BatchUpdateManager 合并多个连续更新。

```typescript
// 多次更新
engine.updateValue('name', 'John')
engine.updateValue('age', 25)
engine.updateValue('city', 'Beijing')

// ↓ 自动合并为一次批量更新
engine.updateValue({
  name: 'John',
  age: 25,
  city: 'Beijing'
})
```

### 4. 按需渲染

- 使用 `ifShow` 控制节点的渲染（不渲染隐藏节点）
- 使用 `v-show` 控制节点的显示（保留 DOM，只是隐藏）
- 列表使用虚拟滚动（可选）

### 5. 组件懒加载

```typescript
const InputComponent = defineAsyncComponent(() => import('./MyInput.vue'))

registry.register({
  name: 'Input',
  component: InputComponent,
  type: 'field'
})
```

### 6. 事件批处理

```typescript
const handler = createEventHandler(engine, registry, {
  enableBatch: true,
  batchDelay: 16
})
```

## 扩展机制

### 1. 自定义组件

开发自定义组件只需遵循接口规范：

```typescript
// 字段组件
interface FieldComponentProps {
  modelValue: any
  disabled?: boolean
  readonly?: boolean
}

interface FieldComponentEmits {
  'update:modelValue': (value: any) => void
}
```

### 2. 自定义预设

创建预设只需实现 `ComponentPreset` 接口：

```typescript
export const MyPreset: ComponentPreset = {
  name: 'my-preset',
  components: [/* ... */],
  formItem: MyFormItem,
  ruleConverter: myRuleConverter
}
```

### 3. 自定义容器

可以替换默认的容器组件：

```vue
<FormAdapter
  :schema="schema"
  :components="myComponents"
  :options="{
    formItem: MyCustomFormItem
  }"
/>
```

### 4. 自定义渲染逻辑

通过 `customRender` 实现自定义渲染：

```typescript
registry.register({
  name: 'CustomWidget',
  component: CustomWidget,
  type: 'field',
  customRender: (props: RenderProps) => {
    return h('div', { class: 'custom' }, [
      h(CustomWidget, {
        value: props.value,
        onChange: props.updateValue
      })
    ])
  }
})
```

## 测试策略

### 单元测试

- 核心模块测试（ReactiveEngine、ComponentRegistry、EventHandler）
- 工具函数测试
- 使用 Vitest

### 集成测试

- 完整的表单渲染测试
- 用户交互测试
- 使用 @vue/test-utils

### 测试示例

```typescript
import { mount } from '@vue/test-utils'
import { FormAdapter } from '@form-renderer/adapter-vue3'

describe('FormAdapter', () => {
  it('应该渲染表单', () => {
    const wrapper = mount(FormAdapter, {
      props: {
        schema: {
          type: 'form',
          properties: {
            name: { type: 'field', component: 'Input' }
          }
        },
        components: [
          { name: 'Input', component: MockInput, type: 'field' }
        ]
      }
    })

    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('应该更新值', async () => {
    const wrapper = mount(FormAdapter, {
      props: { /* ... */ }
    })

    await wrapper.find('input').setValue('John')
    expect(wrapper.vm.getValue('name')).toBe('John')
  })
})
```

## 调试技巧

### 1. 查看响应式数据

```typescript
import { toRaw } from 'vue'

// 获取原始对象（去除响应式包装）
const rawSchema = toRaw(renderSchema.value)
console.log('原始 Schema:', rawSchema)
```

### 2. 启用日志

在 ReactiveEngine 中添加日志：

```typescript
private handleValueChange(event: ValueChangeEvent): void {
  console.log('[ReactiveEngine] 值变化:', event)
  // ...
}
```

### 3. 使用 Vue Devtools

安装 Vue Devtools 浏览器扩展，可以查看：
- 组件树
- 响应式数据
- 事件触发
- 性能分析

### 4. 性能分析

```typescript
import { startMeasure, stopMeasure } from 'vue'

startMeasure('form-render')
// ... 渲染代码
stopMeasure('form-render')
```

## 常见问题

### 1. 为什么使用 shallowRef？

- FormEngine 已经采用不可变更新，每次更新都会返回新引用
- `shallowRef` 只追踪引用变化，性能更好
- 避免深度响应式的额外开销

### 2. 为什么需要 UpdateScheduler？

- 合并多个连续更新，减少引擎调用次数
- 使用 `requestAnimationFrame` 调度，与浏览器渲染同步
- 提升性能，减少不必要的渲染

### 3. 值转换器（ValueTransformer）什么时候使用？

当组件值和引擎值类型不一致时使用，例如：
- 日期组件：`Date` ↔ `string`
- 数字组件：`number` ↔ `string`
- 多选组件：`string[]` ↔ `string`（逗号分隔）

### 4. RuleConverter 和 validators 有什么区别？

- `validators` 是 FormEngine 的校验器，使用 Engine 的校验
- `ruleConverter` 将 validators 转换为 UI 框架的 rules 格式，使用 UI 框架的校验
- 使用 ruleConverter 时，优先使用 UI 框架的校验

### 5. 如何调试组件找不到的问题？

```typescript
const registry = formRef.value.getRegistry()

// 检查组件是否注册
console.log('Input 已注册:', registry.has('Input'))

// 查看所有已注册的组件
console.log('已注册的组件:', registry.getRegisteredNames())

// 查看统计信息
console.log('统计:', registry.getStats())
```

## 最佳实践

1. **使用预设而非手动注册组件**
2. **启用更新调度器以优化性能**
3. **为自定义组件提供完整的类型定义**
4. **使用 RuleConverter 集成 UI 框架的校验**
5. **避免在组件中直接操作 FormEngine**
6. **使用 Composable 实现复杂逻辑**
7. **编写单元测试覆盖核心功能**

## 扩展阅读

- [API 文档](./API.md)
- [组件预设开发指南](./COMPONENT_PRESET.md)
- [响应式引擎详解](./REACTIVE_ENGINE.md)
- [FormEngine 文档](../../Engine/README.md)


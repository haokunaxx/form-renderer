# FormAdapter

FormAdapter 是基于 FormEngine 的 Vue3 表单渲染适配器，提供了完整的表单渲染、交互和组件集成能力。它将 FormEngine 的声明式 Schema 转换为可视化的 Vue 组件，并提供响应式的数据绑定和事件处理。

## 项目结构
详见 [项目结构文档](./docs/PROJECT_STRUCTURE.md)。

## 核心特性

### 1. 响应式引擎集成
- **Vue3 响应式系统深度集成**
- 基于 `shallowRef` 的性能优化
- **不可变数据流，确保追踪性**
- 自动同步 FormEngine 和 Vue 状态

### 2. 组件注册系统
- 灵活的组件定义机制
- 支持单个注册、批量注册和预设注册
- 内置值转换器和事件映射
- 支持自定义渲染逻辑

### 3. 事件处理系统
- 统一的事件处理接口
- 可选的批量更新优化
- 完整的事件生命周期管理
- 错误处理和恢复机制

### 4. UI 框架集成
- 支持多种 UI 框架（Element Plus、Ant Design Vue 等）
- 自动转换校验规则（validators → rules）
- FormItem 自动包裹
- 主题和样式定制

### 5. 组合式 API
- `useFormAdapter` - 编程式表单管理
- `useFieldComponent` - 字段组件开发
- 完整的 TypeScript 类型支持
- 响应式状态和方法

### 6. 性能优化
- 智能批量更新调度
- 浅比较优化渲染
- 按需加载组件
- 结构共享机制

## 架构设计

FormAdapter 采用分层架构：

```
FormAdapter
├── FormAdapter.vue         # 主组件（入口）
├── SchemaRenderer.vue      # Schema 渲染器
├── Core 层                 # 核心模块
│   ├── ReactiveEngine      # 响应式引擎
│   ├── ComponentRegistry   # 组件注册表
│   ├── EventHandler        # 事件处理器
│   └── UpdateScheduler     # 更新调度器
├── Composables 层          # 组合式函数
│   ├── useFormAdapter      # 表单适配器
│   └── useFieldComponent   # 字段组件
├── Components 层           # 容器组件
│   ├── FormContainer       # 表单容器
│   ├── LayoutContainer     # 布局容器
│   └── ListContainer       # 列表容器
└── Presets 层             # 预设集成
    ├── ElementPlusPreset  # Element Plus 预设
    └── ExamplePreset      # 示例预设
```

## 设计原则

1. **渐进增强** - 从基础功能到高级特性，按需使用
2. **框架无关** - 核心逻辑与 UI 框架解耦
3. **类型安全** - 完整的 TypeScript 类型定义
4. **性能优先** - 批处理、浅比较、按需更新
5. **开发友好** - 清晰的 API、完善的文档、丰富的示例
6. **扩展性强** - 易于扩展新组件和预设

## 适用场景

- 复杂动态表单渲染
- 低代码/无代码平台
- 配置化表单系统
- 表单设计器/构建器
- 多 UI 框架适配

## 快速开始

### 安装

```bash
npm install @form-renderer/adapter-vue3 @form-renderer/engine vue
```

### 基础使用

```vue
<template>
  <FormAdapter
    :schema="schema"
    v-model:model="formData"
    :components="ElementPlusPreset"
    @submit="handleSubmit"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FormAdapter } from '@form-renderer/adapter-vue3'
import { ElementPlusPreset } from '@form-renderer/adapter-vue3/presets'

const schema = {
  type: 'form',
  properties: {
    name: {
      type: 'field',
      component: 'Input',
      required: true,
      formItemProps: {
        label: '姓名'
      }
    },
    age: {
      type: 'field',
      component: 'InputNumber',
      required: true,
      formItemProps: {
        label: '年龄'
      }
    }
  }
}

const formData = ref({
  name: '',
  age: undefined
})

const handleSubmit = async (data) => {
  console.log('提交数据:', data)
}
</script>
```

### 使用组合式 API

```typescript
import { useFormAdapter } from '@form-renderer/adapter-vue3'
import { ElementPlusPreset } from '@form-renderer/adapter-vue3/presets'

const {
  renderSchema,
  model,
  updateValue,
  validate,
  submit,
  reset
} = useFormAdapter({
  schema: mySchema,
  model: { name: '', age: undefined },
  components: ElementPlusPreset,
  onSubmit: async (data) => {
    await api.submit(data)
  }
})

// 更新值
updateValue('name', 'John')

// 校验表单
const result = await validate()

// 提交表单
await submit()

// 重置表单
reset()
```

## 核心概念

### 1. ReactiveEngine - 响应式引擎

ReactiveEngine 是 FormAdapter 的核心，负责将 FormEngine 与 Vue3 响应式系统集成。

**特性：**
- 基于 `shallowRef` 的浅响应式
- 自动同步 FormEngine 的状态变化
- 支持值变化和结构变化事件
- 可选的更新调度优化

**使用：**

```typescript
import { createReactiveEngine } from '@form-renderer/adapter-vue3'

const engine = createReactiveEngine({
  schema: mySchema,
  model: myModel,
  enableUpdateScheduler: true
})

// 获取响应式 renderSchema（只读）
const renderSchema = engine.getRenderSchema()

// 获取响应式 model（只读）
const model = engine.getModel()

// 更新值
engine.updateValue('name', 'John')

// 销毁引擎
engine.destroy()
```

### 2. ComponentRegistry - 组件注册表

ComponentRegistry 管理所有可用的组件定义。

**组件定义结构：**

```typescript
interface ComponentDefinition {
  name: string                    // 组件名称
  component: Component            // Vue 组件
  type: ComponentType             // 组件类型
  defaultProps?: Record<string, any>
  valueTransformer?: ValueTransformer
  eventMapping?: EventMapping
  needFormItem?: boolean
  customRender?: (props) => VNode
}
```

**使用：**

```typescript
import { createComponentRegistry } from '@form-renderer/adapter-vue3'

const registry = createComponentRegistry()

// 注册单个组件
registry.register({
  name: 'Input',
  component: ElInput,
  type: 'field',
  eventMapping: {
    onChange: 'update:modelValue'
  }
})

// 批量注册
registry.registerBatch([
  { name: 'Input', component: ElInput, type: 'field' },
  { name: 'Select', component: ElSelect, type: 'field' }
])

// 注册预设
registry.registerPreset(ElementPlusPreset)

// 获取组件
const inputDef = registry.get('Input')
```

### 3. EventHandler - 事件处理器

EventHandler 负责处理所有用户交互事件。

**事件类型：**
- 字段值变化（change）
- 字段聚焦/失焦（focus/blur）
- 列表操作（add/remove/move）

**使用：**

```typescript
import { createEventHandler } from '@form-renderer/adapter-vue3'

const handler = createEventHandler(engine, registry, {
  enableBatch: true,
  batchDelay: 16
})

// 处理字段变化
handler.handleFieldChange('name', 'John', 'Input')

// 处理列表添加
handler.handleListAdd('items', { name: '', price: 0 })

// 处理列表删除
handler.handleListRemove('items', 0)

// 立即刷新批量更新
handler.flush()
```

**事件处理层次：**

FormAdapter 支持两种层次的事件处理：

1. **核心事件**（由 EventHandler 处理）：
   - `onChange`: 字段值变化，会更新 model
   - `onInput`: 输入事件，只更新显示值
   - `onFocus`: 字段聚焦
   - `onBlur`: 字段失焦

2. **字段级自定义事件**（直接绑定到组件）：
   - `onKeydown`、`onKeyup`: 键盘事件
   - `onClick`、`onMouseenter`: 鼠标事件
   - 以及任何组件支持的原生事件

**使用自定义事件：**

```typescript
const schema = {
  fields: [
    {
      path: 'username',
      component: 'input',
      componentProps: {
        // 在 componentProps 中定义事件处理器
        onKeydown: (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            // 处理回车
          }
        },
        onFocus: () => {
          console.log('字段获得焦点')
        }
      }
    }
  ]
}
```

详见：[自定义事件处理指南](./docs/CUSTOM_EVENTS.md)

### 4. 组件预设（ComponentPreset）

组件预设是一组预定义的组件配置，方便快速集成 UI 框架。

**预设结构：**

```typescript
interface ComponentPreset {
  name: string                    // 预设名称
  components: ComponentDefinition[] // 组件列表
  formItem?: Component            // FormItem 组件
  ruleConverter?: RuleConverter   // 校验规则转换器
  theme?: ThemeConfig             // 主题配置
  setup?: () => void              // 初始化函数
}
```

**示例：**

```typescript
export const MyPreset: ComponentPreset = {
  name: 'my-preset',
  components: [
    {
      name: 'Input',
      component: MyInput,
      type: 'field',
      eventMapping: {
        onChange: 'update:modelValue'
      }
    }
  ],
  formItem: MyFormItem,
  ruleConverter: (node, computed, context) => {
    const rules = []
    if (computed.required) {
      rules.push({ required: true, message: '必填' })
    }
    return rules
  }
}
```

## 组件开发

### 字段组件（Field Component）

字段组件是最基础的组件类型，用于渲染表单字段。

**接口规范：**

```typescript
interface FieldComponentProps {
  modelValue: any          // v-model 绑定值
  disabled?: boolean       // 禁用状态
  readonly?: boolean       // 只读状态
  placeholder?: string     // 占位符
  [key: string]: any       // 其他属性
}

interface FieldComponentEmits {
  'update:modelValue': (value: any) => void
  focus?: (event: FocusEvent) => void
  blur?: (event: FocusEvent) => void
  change?: (value: any) => void
}
```

**示例：**

```vue
<template>
  <input
    :value="modelValue"
    :disabled="disabled"
    :readonly="readonly"
    :placeholder="placeholder"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  modelValue: any
  disabled?: boolean
  readonly?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const handleInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

const handleFocus = (e: FocusEvent) => {
  emit('focus', e)
}

const handleBlur = (e: FocusEvent) => {
  emit('blur', e)
}
</script>
```

### 布局组件（Layout Component）

布局组件用于组织和排列表单字段。

```vue
<template>
  <div class="layout-container">
    <h3 v-if="title">{{ title }}</h3>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>
```

### 列表组件（List Component）

列表组件用于渲染动态列表。

```vue
<template>
  <div class="list-container">
    <div v-for="(row, index) in rows" :key="index" class="list-item">
      <slot :row="row" :index="index" />
      <button @click="emit('remove', index)">删除</button>
    </div>
    <button @click="emit('add')">添加</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  rows: any[]
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()
</script>
```

## 值转换器（ValueTransformer）

值转换器用于在组件值和引擎值之间进行转换。

**使用场景：**
- 日期组件：`Date` ↔ `string`
- 数字组件：`number` ↔ `string`
- 多选组件：`string[]` ↔ `string`（逗号分隔）

**示例：**

```typescript
const dateTransformer: ValueTransformer = {
  // 引擎值 → 组件值
  toComponent: (engineValue: string) => {
    return engineValue ? new Date(engineValue) : null
  },
  // 组件值 → 引擎值
  fromComponent: (componentValue: Date | null) => {
    return componentValue ? componentValue.toISOString() : ''
  }
}

// 注册时使用
registry.register({
  name: 'DatePicker',
  component: ElDatePicker,
  type: 'field',
  valueTransformer: dateTransformer
})
```

## 校验规则转换（RuleConverter）

RuleConverter 将 FormEngine 的 validators 转换为 UI 框架的 rules 格式。

**示例（Element Plus）：**

```typescript
const ruleConverter: RuleConverter = (node, computed, context) => {
  const rules = []

  // 必填校验
  if (computed.required) {
    rules.push({
      required: true,
      message: `${node.formItemProps?.label || '该字段'}为必填项`,
      trigger: 'blur'
    })
  }

  // 自定义校验器
  if (node.validators && Array.isArray(node.validators)) {
    node.validators.forEach((validator) => {
      rules.push({
        validator: async (rule, value, callback) => {
          try {
            const ctx = {
              path: node.path,
              getSchema: context.engine.getEngine().getSchema,
              getValue: context.engine.getEngine().getValue,
              getCurRowValue: () => ({}),
              getCurRowIndex: () => -1
            }
            const result = await validator(value, ctx)
            
            if (result === false || typeof result === 'string') {
              callback(new Error(typeof result === 'string' ? result : '校验失败'))
            } else {
              callback()
            }
          } catch (error) {
            callback(error)
          }
        },
        trigger: 'blur'
      })
    })
  }

  return rules
}
```

## FormItem 集成

FormItem 组件用于包裹字段组件，提供标签、错误信息等。

**要求：**
- 接收 `label`、`required`、`error` 等 props
- 提供默认插槽用于渲染字段组件
- 支持校验规则（如果使用 ruleConverter）

**示例（Element Plus）：**

```vue
<template>
  <el-form-item
    :label="label"
    :required="required"
    :prop="prop"
    :rules="rules"
    :error="error"
  >
    <slot />
  </el-form-item>
</template>
```

## 更新调度（UpdateScheduler）

UpdateScheduler 用于优化批量更新性能。

**特性：**
- 使用 `requestAnimationFrame` 调度
- 合并多个连续更新
- 避免不必要的渲染

**使用：**

```typescript
// 创建时启用
const engine = createReactiveEngine({
  schema: mySchema,
  model: myModel,
  enableUpdateScheduler: true
})

// 多次更新会自动合并
engine.updateValue('name', 'John')
engine.updateValue('age', 25)
engine.updateValue('city', 'Beijing')
// ↑ 这三次更新会在下一帧合并为一次批量更新

// 立即刷新
engine.flush()
```

## 性能优化

### 1. 使用 shallowRef

FormAdapter 使用 `shallowRef` 而非 `ref`，避免深度响应式的性能开销。

```typescript
// ✅ 好
const renderSchema = shallowRef(engine.getRenderSchema())

// ❌ 差
const renderSchema = ref(engine.getRenderSchema())
```

### 2. 启用更新调度

```typescript
const engine = createReactiveEngine({
  schema,
  model,
  enableUpdateScheduler: true  // ✅ 启用批量更新
})
```

### 3. 启用事件批处理

```typescript
const handler = createEventHandler(engine, registry, {
  enableBatch: true,  // ✅ 启用批处理
  batchDelay: 16
})
```

### 4. 避免不必要的计算属性

```typescript
// ✅ 好：浅比较
const renderSchema = computed(() => engine.getRenderSchema().value)

// ❌ 差：深比较
const renderSchema = computed(() => JSON.parse(JSON.stringify(engine.getRenderSchema().value)))
```

### 5. 使用组件懒加载

```typescript
const InputComponent = defineAsyncComponent(() => import('./MyInput.vue'))

registry.register({
  name: 'Input',
  component: InputComponent,
  type: 'field'
})
```

## 调试

### 启用日志

```typescript
// 在 FormAdapter 组件中查看日志
console.log('RenderSchema:', renderSchema.value)
console.log('Model:', model.value)
console.log('Engine:', engine.value)
```

### 使用 Vue Devtools

安装 Vue Devtools 浏览器扩展，可以查看：
- 组件树
- 响应式数据
- 事件触发

### 性能分析

```typescript
// 使用 Vue 3 的性能 API
import { startMeasure, stopMeasure } from 'vue'

startMeasure('form-render')
// ... 渲染代码
stopMeasure('form-render')
```

## API 文档
详见 [API 文档](./docs/API.md)。

## 完整示例

### 动态表单

```vue
<template>
  <FormAdapter
    :schema="schema"
    v-model:model="formData"
    :components="ElementPlusPreset"
    @change="handleChange"
    @submit="handleSubmit"
    ref="formRef"
  />
  
  <div class="actions">
    <button @click="handleValidate">校验</button>
    <button @click="handleReset">重置</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FormAdapter } from '@form-renderer/adapter-vue3'
import { ElementPlusPreset } from '@form-renderer/adapter-vue3/presets'

const formRef = ref()

const schema = {
  type: 'form',
  properties: {
    userType: {
      type: 'field',
      component: 'Select',
      formItemProps: { label: '用户类型' },
      componentProps: {
        options: [
          { label: '个人', value: 'personal' },
          { label: '企业', value: 'company' }
        ]
      }
    },
    personalInfo: {
      type: 'layout',
      ifShow: (ctx) => ctx.getValue('userType') === 'personal',
      properties: {
        name: {
          type: 'field',
          component: 'Input',
          required: true,
          formItemProps: { label: '姓名' }
        },
        idCard: {
          type: 'field',
          component: 'Input',
          required: true,
          formItemProps: { label: '身份证号' },
          validators: [
            (value) => {
              if (value && value.length !== 18) {
                return '身份证号必须是18位'
              }
            }
          ]
        }
      }
    },
    companyInfo: {
      type: 'layout',
      ifShow: (ctx) => ctx.getValue('userType') === 'company',
      properties: {
        companyName: {
          type: 'field',
          component: 'Input',
          required: true,
          formItemProps: { label: '企业名称' }
        },
        creditCode: {
          type: 'field',
          component: 'Input',
          required: true,
          formItemProps: { label: '统一社会信用代码' }
        }
      }
    },
    items: {
      type: 'list',
      items: {
        name: {
          type: 'field',
          component: 'Input',
          required: true,
          formItemProps: { label: '商品名称' }
        },
        price: {
          type: 'field',
          component: 'InputNumber',
          required: true,
          formItemProps: { label: '价格' },
          validators: [
            (value) => {
              if (value <= 0) return '价格必须大于0'
            }
          ]
        },
        quantity: {
          type: 'field',
          component: 'InputNumber',
          required: true,
          formItemProps: { label: '数量' }
        },
        total: {
          type: 'field',
          component: 'InputNumber',
          readonly: true,
          formItemProps: { label: '小计' },
          subscribes: {
            '.price': (ctx) => {
              const row = ctx.getCurRowValue()
              ctx.updateSelf((row.price || 0) * (row.quantity || 0))
            },
            '.quantity': (ctx) => {
              const row = ctx.getCurRowValue()
              ctx.updateSelf((row.price || 0) * (row.quantity || 0))
            }
          }
        }
      }
    }
  }
}

const formData = ref({
  userType: '',
  items: []
})

const handleChange = (event) => {
  console.log('值变化:', event)
}

const handleValidate = async () => {
  const result = await formRef.value.validate()
  console.log('校验结果:', result)
}

const handleSubmit = async (data) => {
  console.log('提交数据:', data)
  // 调用 API
  await api.submitForm(data)
}

const handleReset = () => {
  formRef.value.reset()
}
</script>
```

## 常见问题

### 1. 为什么 v-model 不更新？

确保 FormAdapter 使用了 `v-model:model` 而不是 `:model`：

```vue
<!-- ✅ 正确 -->
<FormAdapter v-model:model="formData" :schema="schema" />

<!-- ❌ 错误 -->
<FormAdapter :model="formData" :schema="schema" />
```

### 2. 组件找不到？

确保组件已注册：

```typescript
// 检查组件是否已注册
const registry = formRef.value.getRegistry()
console.log(registry.has('Input'))  // 应该返回 true
```

### 3. 校验不生效？

检查以下几点：
- 是否正确配置了 `required` 或 `validators`
- 是否使用了 `ruleConverter`（UI 框架校验）
- 字段是否被隐藏（`ifShow: false`）或禁用（`disabled: true`）

### 4. 性能问题？

尝试以下优化：
- 启用 `enableUpdateScheduler`
- 启用 `enableBatch`
- 使用组件懒加载
- 减少深度响应式

### 5. 如何调试事件？

在 FormAdapter 组件上监听所有事件：

```vue
<FormAdapter
  @change="console.log('change', $event)"
  @field-blur="console.log('blur', $event)"
  @field-focus="console.log('focus', $event)"
  @list-change="console.log('list', $event)"
  @validate="console.log('validate', $event)"
/>
```

## 最佳实践

### 1. 组件注册

**推荐：使用预设**

```typescript
// ✅ 好
import { ElementPlusPreset } from '@form-renderer/adapter-vue3/presets'

<FormAdapter :components="ElementPlusPreset" />
```

**不推荐：手动注册每个组件**

```typescript
// ❌ 繁琐
const components = [
  { name: 'Input', component: ElInput, type: 'field' },
  { name: 'Select', component: ElSelect, type: 'field' },
  // ... 很多组件
]
```

### 2. 表单数据管理

**推荐：使用 ref**

```typescript
// ✅ 好
const formData = ref({ name: '', age: 0 })

<FormAdapter v-model:model="formData" />
```

**不推荐：使用 reactive**

```typescript
// ⚠️ 可能导致类型问题
const formData = reactive({ name: '', age: 0 })
```

### 3. 事件处理

**推荐：使用具名回调**

```vue
<template>
  <FormAdapter
    @change="handleChange"
    @submit="handleSubmit"
  />
</template>

<script setup>
const handleChange = (event) => {
  // 处理变化
}

const handleSubmit = async (data) => {
  // 提交逻辑
}
</script>
```

### 4. Schema 定义

**推荐：提取为单独的文件**

```typescript
// schemas/user-form.ts
export const userFormSchema = {
  type: 'form',
  properties: {
    // ...
  }
}

// 使用
import { userFormSchema } from './schemas/user-form'
```

## 迁移指南

### 从原生表单迁移

```vue
<!-- 原生表单 -->
<form @submit="handleSubmit">
  <div>
    <label>姓名</label>
    <input v-model="formData.name" required />
  </div>
  <div>
    <label>年龄</label>
    <input v-model.number="formData.age" type="number" required />
  </div>
  <button type="submit">提交</button>
</form>

<!-- 迁移到 FormAdapter -->
<FormAdapter
  :schema="{
    type: 'form',
    properties: {
      name: {
        type: 'field',
        component: 'Input',
        required: true,
        formItemProps: { label: '姓名' }
      },
      age: {
        type: 'field',
        component: 'InputNumber',
        required: true,
        formItemProps: { label: '年龄' }
      }
    }
  }"
  v-model:model="formData"
  @submit="handleSubmit"
/>
```

## 扩展阅读

- [项目结构](./docs/PROJECT_STRUCTURE.md)
- [API 文档](./docs/API.md)
- [组件预设开发指南](./docs/COMPONENT_PRESET.md)
- [响应式引擎详解](./docs/REACTIVE_ENGINE.md)
- [FormEngine 文档](../Engine/README.md)

## License

MIT


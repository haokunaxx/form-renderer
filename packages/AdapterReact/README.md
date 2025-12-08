# @form-renderer/adapter-react

React 适配器for FormEngine，提供完整的表单渲染、交互和组件集成能力。

## 特性

- 🎯 **React 18+支持** - 使用最新的 React Hooks API
- 📦 **useSyncExternalStore** - 高效的状态订阅机制
- 🔧 **类型安全** - 完整的 TypeScript 类型定义
- 🎨 **UI 框架无关** - 可与任何 UI 框架集成
- 📱 **性能优化** - React.memo + 结构共享
- 🔥 **Hooks API** - useFormAdapter 和 useFieldComponent

## 安装

```bash
npm install @form-renderer/adapter-react @form-renderer/engine react react-dom
# 或
pnpm add @form-renderer/adapter-react @form-renderer/engine react react-dom
```

## 快速开始

### 基础使用

```tsx
import { FormAdapter } from '@form-renderer/adapter-react'
import { AntdPreset } from '@form-renderer/preset-antd'
import { useState } from 'react'

const App = () => {
  const [model, setModel] = useState({ name: '', age: 0 })

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

  const handleChange = (event: any) => {
    console.log('值变化:', event)
  }

  const handleSubmit = async (data: any) => {
    console.log('提交数据:', data)
  }

  return (
    <FormAdapter
      schema={schema}
      model={model}
      components={AntdPreset}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  )
}
```

### 使用 Hooks

```tsx
import { useFormAdapter } from '@form-renderer/adapter-react'
import { AntdPreset } from '@form-renderer/preset-antd'

const App = () => {
  const {
    renderSchema,
    model,
    updateValue,
    validate,
    submit,
    reset
  } = useFormAdapter({
    schema: mySchema,
    model: { name: '', age: 0 },
    components: AntdPreset,
    onSubmit: async (data) => {
      await api.submit(data)
    }
  })

  return (
    <div>
      {/* 自定义渲染 */}
      <button onClick={() => validate()}>校验</button>
      <button onClick={() => submit()}>提交</button>
      <button onClick={() => reset()}>重置</button>
    </div>
  )
}
```

## 核心概念

### StateEngine

StateEngine 是 React 版本的响应式引擎，将 FormEngine 与 React 集成。

**特性：**
- 基于订阅/通知模式
- 提供 useSyncExternalStore 所需的接口
- 不可变数据更新
- 支持列表操作

**使用：**

```typescript
import { createStateEngine } from '@form-renderer/adapter-react'

const engine = createStateEngine({
  schema: mySchema,
  model: myModel
})

// 订阅状态变化
const unsubscribe = engine.subscribe(() => {
  console.log('状态已更新')
})

// 获取快照
const snapshot = engine.getSnapshot()
console.log(snapshot.renderSchema, snapshot.model)

// 更新值
engine.updateValue('name', 'John')

// 销毁
unsubscribe()
engine.destroy()
```

### ComponentRegistry

组件注册中心，管理所有可用的组件定义。

```typescript
import { createComponentRegistry } from '@form-renderer/adapter-react'

const registry = createComponentRegistry()

// 注册单个组件
registry.register({
  name: 'Input',
  component: MyInput,
  type: 'field',
  eventMapping: {
    onChange: (e) => e.target.value
  }
})

// 批量注册
registry.registerBatch([...])

// 注册预设
registry.registerPreset(AntdPreset)
```

### EventHandler

事件处理器，负责处理所有用户交互事件。

```typescript
import { createEventHandler } from '@form-renderer/adapter-react'

const handler = createEventHandler(engine, registry, {
  onTransformError: (error, path, value) => {
    console.error('Transform error:', { error, path, value })
  },
  onUpdateError: (error, path, value) => {
    console.error('Update error:', { error, path, value })
  }
})

// 处理字段变化
handler.handleFieldChange('name', 'John', 'Input')

// 处理列表操作
handler.handleListAdd('items', { name: '', price: 0 })
handler.handleListRemove('items', 0)
```

## API

### FormAdapter Props

| 属性 | 类型 | 说明 |
|------|------|------|
| schema | `FormSchema` | 表单 Schema（必填） |
| model | `FormModel` | 表单数据 |
| components | `ComponentDefinition[] \| ComponentPreset` | 组件配置 |
| options | `AdapterOptions` | 配置选项 |
| onChange | `(event) => void` | 值变化回调 |
| onValidate | `(result) => void` | 校验回调 |
| onSubmit | `(data) => void` | 提交回调 |
| onReady | `(engine) => void` | 初始化完成回调 |

### FormAdapter Ref

```typescript
interface FormAdapterRef {
  getValue: (path?: string) => any
  updateValue: (path: string, value: any) => void
  updateValues: (values: Record<string, any>) => void
  validate: (paths?: string[]) => Promise<ValidationResult>
  submit: () => Promise<void>
  reset: (target?: any | 'default') => void
  flush: () => void
  getEngine: () => StateEngine | undefined
  getRegistry: () => ComponentRegistry | undefined
  getEventHandler: () => any | undefined
}
```

### useFormAdapter Options

| 属性 | 类型 | 说明 |
|------|------|------|
| schema | `FormSchema` | 表单 Schema（必填） |
| model | `FormModel` | 表单数据 |
| components | `ComponentDefinition[] \| ComponentPreset` | 组件配置 |
| onSubmit | `(data) => void \| Promise<void>` | 提交回调 |
| onChange | `(event) => void` | 值变化回调 |
| onValidate | `(result) => void` | 校验回调 |
| onReady | `(engine) => void` | 初始化完成回调 |
| options | `AdapterOptions` | 配置选项 |

### useFormAdapter 返回值

```typescript
interface UseFormAdapterReturn {
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
```

## 性能优化

### React.memo + 结构共享

FormEngine 使用不可变更新，配合 React.memo 可以跳过未改变组件的渲染：

```typescript
export const SchemaRenderer = React.memo(
  ({ node, context }) => {
    // 渲染逻辑
  },
  (prev, next) => {
    // 引用相等检查，未改变的节点会跳过渲染
    return prev.node === next.node
  }
)
```

### useSyncExternalStore

使用 React 18 的 useSyncExternalStore 订阅外部状态，支持并发渲染：

```typescript
const state = useSyncExternalStore(
  engine.subscribe,
  engine.getSnapshot
)
```

## 与 Vue3 版本的对比

| 特性 | Vue3 实现 | React 实现 |
|------|-----------|------------|
| 状态管理 | ReactiveEngine + shallowRef | StateEngine + useSyncExternalStore |
| 订阅机制 | Vue 响应式系统 | 手动订阅/通知模式 |
| 组件更新 | 自动依赖追踪 | 显式订阅 + React 调度 |
| 性能优化 | shallowRef + computed | React.memo + useCallback |
| 批量更新 | UpdateScheduler + RAF | React 18 自动批量 |

## License

MIT


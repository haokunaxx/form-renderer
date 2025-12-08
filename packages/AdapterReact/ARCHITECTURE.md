# React Adapter 架构设计

## 概述

React Adapter 是 form-renderer 的 React 版本实现，基于 Vue3 版本的架构设计，适配 React 的状态管理和组件系统。

## 核心差异

### Vue3 vs React

| 维度 | Vue3 实现 | React 实现 |
|------|-----------|------------|
| **状态管理** | ReactiveEngine + shallowRef | StateEngine + useSyncExternalStore |
| **响应式追踪** | 自动依赖收集 | 手动订阅/通知 |
| **组件更新** | 响应式数据变化自动触发 | setState 触发 re-render |
| **性能优化** | shallowRef + 结构共享 | React.memo + useMemo |
| **批量更新** | Engine UpdateScheduler (微任务) | Engine UpdateScheduler (微任务) |

## 架构层次

```
React Adapter
├── Core 层
│   ├── StateEngine          # 状态引擎（替代 ReactiveEngine）
│   ├── ComponentRegistry    # 组件注册表（复用）
│   ├── EventHandler         # 事件处理器（复用）
│   └── ComponentNormalizer  # 组件标准化（复用）
│
├── Hooks 层
│   ├── useFormAdapter       # 表单适配器 Hook
│   └── useFieldComponent    # 字段组件 Hook
│
├── Components 层
│   ├── FormAdapter          # 主组件
│   ├── SchemaRenderer       # Schema 渲染器
│   ├── containers/          # 容器组件
│   │   ├── FormContainer
│   │   ├── LayoutContainer
│   │   └── ListContainer
│   └── wrappers/
│       └── FieldWrapper     # 字段包装器
│
└── Utils 层
    └── (工具函数预留)
```

## 核心实现

### 1. StateEngine

StateEngine 是 React 版本的状态引擎，提供 useSyncExternalStore 所需的接口。

**关键特性：**
- 订阅/通知模式
- 不可变状态快照
- 与 FormEngine 集成

**实现要点：**

```typescript
class StateEngine {
  private engine: FormEngine
  private listeners: Set<Listener> = new Set()
  private currentSnapshot: StateSnapshot

  // useSyncExternalStore 需要的订阅函数
  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // useSyncExternalStore 需要的快照函数
  getSnapshot = (): StateSnapshot => {
    return this.currentSnapshot
  }

  // 监听 FormEngine 变化
  private setupEventListeners(): void {
    this.engine.onValueChange(() => {
      // 更新快照
      this.currentSnapshot = {
        renderSchema: this.engine.getRenderSchema(),
        model: this.engine.getValue()
      }
      // 通知订阅者
      this.notifyListeners()
    })
  }
}
```

### 2. useFormAdapter Hook

提供完整的表单管理功能。

**实现要点：**

```typescript
export function useFormAdapter(options: UseFormAdapterOptions) {
  const engineRef = useRef<StateEngine>()
  
  // 使用 useSyncExternalStore 订阅状态
  const state = useSyncExternalStore(
    useCallback((callback) => {
      return engineRef.current?.subscribe(callback) || (() => {})
    }, []),
    useCallback(() => {
      return engineRef.current?.getSnapshot() || { renderSchema: null, model: {} }
    }, [])
  )

  return {
    renderSchema: state.renderSchema,
    model: state.model,
    // ... 其他方法
  }
}
```

### 3. SchemaRenderer

递归渲染 RenderNode 树。

**性能优化：**

```typescript
export const SchemaRenderer = React.memo(
  ({ node, context }) => {
    // 根据节点类型选择容器
    if (node.type === 'form') return <FormContainer />
    if (node.type === 'layout') return <LayoutContainer />
    if (node.type === 'list') return <ListContainer />
    if (node.type === 'field') return <FieldWrapper />
  },
  (prev, next) => {
    // 利用 FormEngine 的结构共享
    return prev.node === next.node && prev.context === next.context
  }
)
```

### 4. FieldWrapper

包装字段组件，处理值转换和事件绑定。

**关键逻辑：**

```typescript
export const FieldWrapper: React.FC<Props> = ({ node, context }) => {
  // 获取引擎值
  const engineValue = context.engine.getValue(node.path)
  
  // 应用值转换器
  const componentValue = useMemo(() => {
    return definition.valueTransformer?.toComponent(engineValue) ?? engineValue
  }, [engineValue, definition.valueTransformer])
  
  // 处理值变化
  const handleChange = useCallback((value: any) => {
    const engineValue = definition.valueTransformer?.fromComponent(value) ?? value
    context.eventHandler?.handleFieldChange(node.path, engineValue, node.component)
  }, [node.path, node.component, definition.valueTransformer])
  
  // 渲染字段组件
  return <FieldComponent value={componentValue} onChange={handleChange} />
}
```

## Ant Design 预设

### 组件映射

支持 Ant Design 5.x 的主要组件：

- **基础输入**: Input, Textarea, InputNumber
- **选择器**: Select, Cascader, CheckboxGroup, RadioGroup
- **日期时间**: DatePicker, TimePicker
- **特殊输入**: Switch, Slider, Rate, Upload
- **容器**: Form, Layout, List

### 值转换器

处理 Ant Design 特殊的值类型：

```typescript
// DatePicker: string ↔ Dayjs
export const dateTransformer: ValueTransformer = {
  toComponent: (value: string) => value ? dayjs(value) : null,
  fromComponent: (value: Dayjs | null) => value ? value.toISOString() : ''
}
```

### 事件映射

处理 Ant Design 的事件差异：

```typescript
// Input onChange 返回 event 对象
export const inputEventMapping: EventMapping = {
  onChange: (e: any) => e.target.value
}

// Select onChange 直接返回 value
export const selectEventMapping: EventMapping = {
  onChange: (value: any) => value
}
```

### 校验转换

自动转换 validators 为 Ant Design rules：

```typescript
export const antdRuleConverter: RuleConverter = (node, computed, context) => {
  const rules: any[] = []
  
  if (computed.required) {
    rules.push({
      required: true,
      message: `${node.formItemProps?.label || '该字段'}为必填项`
    })
  }
  
  if (node.validators) {
    node.validators.forEach(validator => {
      rules.push({
        validator: async (_, value) => {
          const result = await validator(value, ctx)
          if (typeof result === 'string') {
            throw new Error(result)
          }
        }
      })
    })
  }
  
  return rules
}
```

## 性能优化策略

### 1. useSyncExternalStore

使用 React 18 的 useSyncExternalStore API：

**优势：**
- 支持并发渲染
- 自动处理撕裂（tearing）
- 与 React 调度器集成

### 2. React.memo + 结构共享

利用 FormEngine 的不可变更新：

```typescript
// 未改变的节点引用相等，React.memo 会跳过渲染
prev.node === next.node // true -> 跳过渲染
```

### 3. useCallback 稳定化回调

```typescript
const handleChange = useCallback((value: any) => {
  eventHandler?.handleFieldChange(path, value, component)
}, [path, component, eventHandler])
```

### 4. 批量更新

批量更新由 Engine 的 UpdateScheduler 自动处理（基于微任务）：

```typescript
// Engine 会自动合并同一事件循环中的多次更新
updateValue('name', 'John')
updateValue('age', 25)
updateValue('city', 'Beijing')

// 等待批量更新完成
await engine.waitFlush()
```

**机制说明：**
- Engine 使用 Promise.resolve() 创建微任务
- 同一事件循环中的更新会被合并
- 通过不可变更新 + 结构共享优化性能
- React 的 useSyncExternalStore 确保状态同步

## 扩展性

### 自定义 UI 框架

可以基于 AdapterReact 创建其他 UI 框架的预设：

```typescript
// 1. 创建组件定义
const MyUIPreset: ComponentPreset = {
  name: 'my-ui',
  components: [
    {
      name: 'Input',
      component: MyInput,
      type: 'field',
      eventMapping: { onChange: (e) => e.target.value }
    }
  ],
  formItem: MyFormItem,
  ruleConverter: myRuleConverter
}

// 2. 使用预设
<FormAdapter schema={schema} components={MyUIPreset} />
```

### 自定义组件

可以扩展预设添加自定义组件：

```typescript
const registry = createComponentRegistry()
registry.registerPreset(AntdPreset)
registry.register({
  name: 'CustomInput',
  component: MyCustomInput,
  type: 'field'
})
```

## 最佳实践

### 1. 使用 useFormAdapter Hook

对于复杂场景，使用 Hook 提供更大灵活性：

```typescript
const { renderSchema, model, updateValue, validate, submit } = useFormAdapter({
  schema,
  model,
  components: AntdPreset
})
```

### 2. 利用结构共享

避免不必要的重渲染：

```typescript
// ✅ 好：利用 memo
export const MyComponent = React.memo(({ data }) => {
  // ...
}, (prev, next) => prev.data === next.data)
```

### 3. 使用 useCallback

保持回调引用稳定：

```typescript
const handleChange = useCallback((event) => {
  // 处理变化
}, [/* 依赖项 */])
```

## 与 Vue3 版本的兼容性

### 相同点

1. **核心模块可复用**：ComponentRegistry、EventHandler、ComponentNormalizer
2. **Schema 定义相同**：使用相同的 FormEngine
3. **预设结构相同**：ComponentPreset 接口一致

### 不同点

1. **状态管理**：Vue 响应式 vs React 订阅模式
2. **组件定义**：Vue Component vs React ComponentType
3. **事件处理**：Vue $emit vs React props 回调

## 总结

React Adapter 成功将 FormEngine 适配到 React 生态，保持了与 Vue3 版本的架构一致性，同时充分利用了 React 的特性和优化手段。通过 StateEngine + useSyncExternalStore 的组合，实现了高效的状态订阅和更新机制。


# 响应式引擎详解

ReactiveEngine 是 FormAdapter 的核心模块，负责将 FormEngine 与 Vue3 响应式系统深度集成。本文档详细介绍其设计原理、工作机制和使用方法。

## 设计目标

1. **Vue3 深度集成** - 将 FormEngine 的数据和状态与 Vue3 响应式系统无缝集成
2. **性能优化** - 使用浅响应式优化性能，避免不必要的深度追踪
3. **不可变数据流** - 配合 FormEngine 的不可变更新机制，确保数据可追踪
4. **自动同步** - 自动同步 FormEngine 的状态变化到 Vue 组件
5. **灵活可控** - 提供多种配置选项，满足不同的使用场景

## 架构设计

### 核心概念

```
FormEngine (纯 JS)
     ↓
ReactiveEngine (Vue3 响应式包装)
     ↓
Vue 组件（自动响应数据变化）
```

### 关键特性

1. **shallowRef 包装**
   - 使用 `shallowRef` 包装 renderSchema 和 model
   - 只追踪引用变化，不追踪内部属性
   - 配合 FormEngine 的不可变更新，性能最优

2. **事件监听**
   - 监听 FormEngine 的 `onValueChange` 事件
   - 自动更新响应式引用
   - 区分值变化和结构变化

3. **只读暴露**
   - 对外暴露只读的响应式引用
   - 防止外部直接修改数据
   - 所有修改必须通过 ReactiveEngine 的方法

4. **更新调度**
   - 可选的更新调度器（UpdateScheduler）
   - 批量合并多个连续更新
   - 使用 requestAnimationFrame 调度

## 源码解析

### 类结构

```typescript
export class ReactiveEngine {
  // 核心实例
  private engine: FormEngine
  
  // 响应式引用（浅响应式）
  private renderSchemaRef: ShallowRef<RenderSchema>
  private modelRef: ShallowRef<FormModel>
  
  // 订阅管理
  private subscriptions: (() => void)[] = []
  
  // 状态标记
  private isDestroyed = false
  
  // 更新调度器（可选）
  private updateScheduler?: UpdateScheduler

  constructor(options: ReactiveEngineOptions)
  
  // ... 方法
}
```

### 初始化流程

```typescript
constructor(options: ReactiveEngineOptions) {
  const { schema, model = {}, enableUpdateScheduler = false } = options
  
  // 1. 创建 FormEngine 实例
  this.engine = new FormEngine({ schema, model })
  
  // 2. 初始化响应式引用（shallowRef）
  this.renderSchemaRef = shallowRef(this.engine.getRenderSchema())
  this.modelRef = shallowRef(this.engine.getValue())

  // 3. 创建更新调度器（可选）
  if (enableUpdateScheduler) {
    this.updateScheduler = new UpdateScheduler(this.engine)
  }

  // 4. 建立响应式连接
  this.setupEventListeners()
}
```

### 事件监听机制

```typescript
private setupEventListeners(): void {
  // 监听值变化事件
  const unsubscribe = this.engine.onValueChange((event: ValueChangeEvent) => {
    if (this.isDestroyed) return

    if (event.event.kind === 'value') {
      // 值变化：更新 model 和 renderSchema
      this.handleValueChange(event)
    } else if (event.event.kind === 'structure') {
      // 结构变化：重新获取 renderSchema
      this.handleStructureChange()
    }
  })

  this.subscriptions.push(unsubscribe)
}
```

### 值变化处理

```typescript
private handleValueChange(event: ValueChangeEvent): void {
  // FormEngine 已采用不可变更新，直接获取新引用
  this.modelRef.value = this.engine.getValue()
  this.renderSchemaRef.value = this.engine.getRenderSchema()
}
```

**关键点：**
- FormEngine 使用不可变更新，每次更新都返回新引用
- 直接赋值新引用给 `shallowRef`，Vue 会自动检测到变化
- 不需要手动触发更新，Vue 响应式系统自动处理

### 结构变化处理

```typescript
private handleStructureChange(): void {
  // 列表操作后，renderNode 和 model 都已经是新引用
  this.renderSchemaRef.value = this.engine.getRenderSchema()
  this.modelRef.value = this.engine.getValue()
}
```

**结构变化场景：**
- 列表添加行（listAppend）
- 列表删除行（listRemove）
- 列表移动行（listMove）
- 列表替换行（listReplace）
- 列表清空（listClear）

### 只读暴露

```typescript
getRenderSchema(): DeepReadonly<ShallowRef<RenderSchema>> {
  return readonly(this.renderSchemaRef)
}

getModel(): DeepReadonly<ShallowRef<FormModel>> {
  return readonly(this.modelRef)
}
```

**为什么使用只读？**
- 防止外部直接修改数据
- 强制所有修改通过 ReactiveEngine 的方法
- 确保数据流的单向性

### 更新方法

```typescript
updateValue(path: string, value: any): void
updateValue(updates: Record<string, any>): void
updateValue(pathOrUpdates: string | Record<string, any>, value?: any): void {
  if (this.isDestroyed) {
    console.warn('Cannot update value on destroyed ReactiveEngine')
    return
  }

  if (this.updateScheduler) {
    // 使用调度器批量更新
    if (typeof pathOrUpdates === 'string') {
      this.updateScheduler.scheduleUpdate(pathOrUpdates, value)
    } else {
      this.updateScheduler.scheduleBatch(pathOrUpdates)
    }
  } else {
    // 直接更新
    if (typeof pathOrUpdates === 'string') {
      this.engine.updateValue(pathOrUpdates, value)
    } else {
      this.engine.updateValue(pathOrUpdates)
    }
  }
}
```

**支持两种更新方式：**
1. 单字段更新：`updateValue('name', 'John')`
2. 批量更新：`updateValue({ name: 'John', age: 25 })`

### 列表操作

```typescript
getListOperator(path: string) {
  if (this.isDestroyed) {
    throw new Error('Cannot get list operator from destroyed ReactiveEngine')
  }

  // 返回包装对象，将方法委托给 FormEngine
  return {
    append: (row: any) => this.engine.listAppend(path, row),
    insert: (index: number, row: any) => this.engine.listInsert(path, index, row),
    remove: (index: number) => this.engine.listRemove(path, index),
    move: (from: number, to: number) => this.engine.listMove(path, from, to),
    swap: (a: number, b: number) => this.engine.listSwap(path, a, b),
    replace: (index: number, row: any) => this.engine.listReplace(path, index, row),
    clear: () => this.engine.listClear(path)
  }
}
```

### 生命周期管理

```typescript
destroy(): void {
  if (this.isDestroyed) return

  this.isDestroyed = true

  // 清理所有订阅
  this.subscriptions.forEach((unsubscribe) => unsubscribe())
  this.subscriptions = []

  // 销毁更新调度器
  if (this.updateScheduler) {
    this.updateScheduler.destroy()
    this.updateScheduler = undefined
  }
}
```

## shallowRef vs ref

### shallowRef（✅ 推荐）

```typescript
const renderSchema = shallowRef({
  type: 'form',
  children: [/* ... */]
})

// 只追踪引用变化
renderSchema.value = newSchema  // ✅ 触发更新

// 不追踪内部属性变化
renderSchema.value.children[0].prop = 'newProp'  // ❌ 不触发更新
```

**优点：**
- 性能优秀，只追踪引用变化
- 配合不可变更新，完全满足需求
- 避免深度响应式的额外开销

**适用场景：**
- 配合不可变数据（如 FormEngine）
- 大型对象或数组
- 性能敏感的场景

### ref（❌ 不推荐）

```typescript
const renderSchema = ref({
  type: 'form',
  children: [/* ... */]
})

// 追踪引用变化
renderSchema.value = newSchema  // ✅ 触发更新

// 追踪内部属性变化
renderSchema.value.children[0].prop = 'newProp'  // ✅ 触发更新
```

**缺点：**
- 深度响应式，性能开销大
- 对于大型对象，会递归追踪所有属性
- 不必要的响应式，FormEngine 已经保证不可变

## 更新调度器（UpdateScheduler）

### 为什么需要更新调度器？

在某些场景下，用户可能在短时间内连续更新多个字段：

```typescript
engine.updateValue('name', 'John')
engine.updateValue('age', 25)
engine.updateValue('city', 'Beijing')
// 这三次更新会触发三次 FormEngine 的 updateValue，可能导致性能问题
```

UpdateScheduler 可以将这些更新合并为一次批量更新：

```typescript
// 自动合并为一次批量更新
engine.updateValue({
  name: 'John',
  age: 25,
  city: 'Beijing'
})
```

### 工作原理

```typescript
class UpdateScheduler {
  private pendingUpdates: Map<string, any> = new Map()
  private timer: number | null = null

  scheduleUpdate(path: string, value: any): void {
    // 1. 收集更新到 Map
    this.pendingUpdates.set(path, value)

    // 2. 使用 requestAnimationFrame 调度
    if (!this.timer) {
      this.timer = requestAnimationFrame(() => {
        this.flush()
      })
    }
  }

  flush(): void {
    if (this.pendingUpdates.size === 0) return

    // 3. 批量应用更新
    const updates = Object.fromEntries(this.pendingUpdates)
    this.pendingUpdates.clear()

    this.engine.updateValue(updates)
  }
}
```

### 使用方式

```typescript
// 创建时启用
const engine = createReactiveEngine({
  schema: mySchema,
  model: myModel,
  enableUpdateScheduler: true  // 启用更新调度器
})

// 连续更新会自动合并
engine.updateValue('name', 'John')
engine.updateValue('age', 25)
engine.updateValue('city', 'Beijing')
// ↑ 在下一帧合并为一次批量更新

// 立即刷新（如果需要）
engine.flush()
```

### 性能对比

**不启用调度器：**
```
更新1 → 触发订阅 → 重算控制属性 → 通知 Vue → 渲染
更新2 → 触发订阅 → 重算控制属性 → 通知 Vue → 渲染
更新3 → 触发订阅 → 重算控制属性 → 通知 Vue → 渲染
```

**启用调度器：**
```
更新1 → 收集
更新2 → 收集
更新3 → 收集
↓
下一帧：批量更新 → 触发订阅 → 重算控制属性 → 通知 Vue → 渲染
```

## 不可变更新机制

### FormEngine 的不可变更新

FormEngine 使用不可变更新策略，每次更新都返回新引用：

```typescript
// FormEngine 内部
updateValue(path: string, value: any): void {
  // 1. 不可变更新 model
  this.model = immutableSet(this.model, path, value)
  
  // 2. 不可变更新 renderNode
  this.renderNode = updateRenderNode(this.renderNode, path)
  
  // 3. 触发 onValueChange 回调
  this.notifyValueChange({ path, prevValue, nextValue })
}
```

### 结构共享

未改变的节点复用引用，节省内存和提升性能：

```typescript
// 更新前
const oldRenderNode = {
  type: 'form',
  children: [
    { path: 'name', computed: { required: true } },    // A
    { path: 'age', computed: { required: false } }     // B
  ]
}

// 更新 name 的值后
const newRenderNode = {
  type: 'form',
  children: [
    { path: 'name', computed: { required: true } },    // A'（新对象）
    { path: 'age', computed: { required: false } }     // B（复用引用）
  ]
}

// 引用比较
oldRenderNode.children[0] !== newRenderNode.children[0]  // true（A 改变了）
oldRenderNode.children[1] === newRenderNode.children[1]  // true（B 未改变）
```

### 与 shallowRef 的配合

```typescript
// ReactiveEngine 中
private handleValueChange(event: ValueChangeEvent): void {
  // FormEngine 返回的已经是新引用
  const newModel = this.engine.getValue()
  const newRenderSchema = this.engine.getRenderSchema()

  // 直接赋值，shallowRef 会检测到引用变化
  this.modelRef.value = newModel
  this.renderSchemaRef.value = newRenderSchema

  // Vue 响应式系统自动处理后续更新
}
```

## 使用示例

### 基础使用

```typescript
import { createReactiveEngine } from '@form-renderer/adapter-vue3'

const engine = createReactiveEngine({
  schema: {
    type: 'form',
    properties: {
      name: { type: 'field' },
      age: { type: 'field' }
    }
  },
  model: { name: '', age: 0 }
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
```

### 在组件中使用

```vue
<template>
  <div>
    <div>名称: {{ model.name }}</div>
    <div>年龄: {{ model.age }}</div>
    <button @click="updateName">更新名称</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { createReactiveEngine } from '@form-renderer/adapter-vue3'

const engine = createReactiveEngine({
  schema: mySchema,
  model: { name: 'John', age: 25 }
})

// 计算属性自动响应
const renderSchema = computed(() => engine.getRenderSchema().value)
const model = computed(() => engine.getModel().value)

const updateName = () => {
  engine.updateValue('name', 'Jane')
}
</script>
```

### 启用更新调度器

```typescript
const engine = createReactiveEngine({
  schema: mySchema,
  model: myModel,
  enableUpdateScheduler: true  // 启用批量更新优化
})

// 连续更新会自动合并
function updateUserInfo() {
  engine.updateValue('name', 'John')
  engine.updateValue('age', 25)
  engine.updateValue('email', 'john@example.com')
  // ↑ 自动合并为一次批量更新
}

// 如果需要立即刷新
engine.flush()
```

### 列表操作

```typescript
const engine = createReactiveEngine({
  schema: {
    type: 'form',
    properties: {
      items: {
        type: 'list',
        items: {
          name: { type: 'field' },
          price: { type: 'field' }
        }
      }
    }
  },
  model: { items: [] }
})

// 获取列表操作器
const listOp = engine.getListOperator('items')

// 添加行
listOp.append({ name: 'Item 1', price: 100 })

// 删除行
listOp.remove(0)

// 移动行
listOp.move(0, 1)

// 替换行
listOp.replace(0, { name: 'New Item', price: 200 })

// 清空列表
listOp.clear()
```

### 表单校验

```typescript
const engine = createReactiveEngine({
  schema: {
    type: 'form',
    properties: {
      email: {
        type: 'field',
        required: true,
        validators: [
          (value) => {
            if (!value.includes('@')) {
              return '邮箱格式不正确'
            }
          }
        ]
      }
    }
  },
  model: { email: '' }
})

// 校验表单
const result = await engine.validate()

if (result === true) {
  console.log('校验通过')
} else {
  console.log('校验失败:', result.errors)
}

// 校验指定字段
const result2 = await engine.validate(['email'])
```

### 生命周期管理

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { createReactiveEngine } from '@form-renderer/adapter-vue3'

let engine: ReactiveEngine | undefined

onMounted(() => {
  // 创建引擎
  engine = createReactiveEngine({
    schema: mySchema,
    model: myModel
  })
})

onBeforeUnmount(() => {
  // 销毁引擎
  engine?.destroy()
})
</script>
```

## 性能优化

### 1. 使用 shallowRef

ReactiveEngine 内部已经使用 `shallowRef`，外部使用时也推荐使用浅响应式：

```typescript
// ✅ 推荐
const renderSchema = computed(() => engine.getRenderSchema().value)

// ❌ 避免
const renderSchema = ref(engine.getRenderSchema().value)
```

### 2. 启用更新调度器

对于频繁更新的场景，启用更新调度器：

```typescript
const engine = createReactiveEngine({
  schema,
  model,
  enableUpdateScheduler: true
})
```

### 3. 批量更新

优先使用对象格式批量更新：

```typescript
// ✅ 推荐
engine.updateValue({
  name: 'John',
  age: 25,
  email: 'john@example.com'
})

// ❌ 避免
engine.updateValue('name', 'John')
engine.updateValue('age', 25)
engine.updateValue('email', 'john@example.com')
```

### 4. 避免不必要的 watch

```typescript
// ❌ 避免：深度监听整个 model
watch(() => model.value, (newModel) => {
  console.log('Model 更新:', newModel)
}, { deep: true })

// ✅ 推荐：只监听需要的字段
watch(() => model.value.name, (newName) => {
  console.log('Name 更新:', newName)
})
```

### 5. 使用计算属性

```typescript
// ✅ 推荐：使用计算属性
const userName = computed(() => model.value.name)

// ❌ 避免：使用 ref + watch
const userName = ref('')
watch(() => model.value.name, (newName) => {
  userName.value = newName
})
```

## 调试技巧

### 1. 查看原始数据

```typescript
import { toRaw } from 'vue'

// 去除响应式包装，查看原始对象
const rawSchema = toRaw(renderSchema.value)
console.log('原始 Schema:', rawSchema)
```

### 2. 监听所有变化

```typescript
watch(() => model.value, (newModel, oldModel) => {
  console.log('Model 变化:', { newModel, oldModel })
}, { deep: true })

watch(() => renderSchema.value, (newSchema, oldSchema) => {
  console.log('Schema 变化:', { newSchema, oldSchema })
})
```

### 3. 检查引擎状态

```typescript
// 检查引擎是否已销毁
console.log('已销毁:', engine.destroyed)

// 获取原始 FormEngine
const rawEngine = engine.getEngine()
console.log('原始 Engine:', rawEngine)
```

### 4. 性能分析

```typescript
import { startMeasure, stopMeasure } from 'vue'

// 性能标记
startMeasure('update-value')
engine.updateValue('name', 'John')
stopMeasure('update-value')
```

## 常见问题

### 1. 为什么使用 shallowRef？

- FormEngine 已经采用不可变更新，每次更新都返回新引用
- `shallowRef` 只追踪引用变化，性能更好
- 避免深度响应式的额外开销

### 2. 为什么需要 readonly？

- 防止外部直接修改数据
- 强制所有修改通过 ReactiveEngine 的方法
- 确保数据流的单向性

### 3. 什么时候启用 UpdateScheduler？

- 频繁更新多个字段时
- 需要优化性能时
- 用户输入场景（如表单填写）

### 4. 如何判断是否需要刷新？

```typescript
// 不启用调度器时，立即刷新
engine.updateValue('name', 'John')
// 已经立即更新，不需要手动刷新

// 启用调度器时，需要等待下一帧
engine.updateValue('name', 'John')
// 如果需要立即获取最新值，手动刷新
engine.flush()
const value = engine.getEngine().getValue('name')
```

### 5. 为什么 model 和 renderSchema 是只读的？

防止以下错误用法：

```typescript
// ❌ 错误：直接修改
const model = engine.getModel()
model.value.name = 'John'  // TypeScript 报错

// ✅ 正确：通过方法更新
engine.updateValue('name', 'John')
```

## 最佳实践

1. **使用 shallowRef 和 computed** - 优化性能
2. **启用更新调度器** - 频繁更新场景
3. **批量更新优先** - 使用对象格式
4. **及时销毁** - 在 onBeforeUnmount 中销毁引擎
5. **避免直接操作 FormEngine** - 通过 ReactiveEngine 的方法操作
6. **使用只读引用** - 不要尝试修改 getRenderSchema 和 getModel 的返回值
7. **监听指定字段** - 避免深度监听整个 model

## 扩展阅读

- [API 文档](./API.md)
- [项目结构](./PROJECT_STRUCTURE.md)
- [组件预设开发指南](./COMPONENT_PRESET.md)
- [FormEngine 文档](../../Engine/README.md)
- [FormEngine 不可变更新机制](../../Engine/docs/IMMUTABLE_UPDATE.md)


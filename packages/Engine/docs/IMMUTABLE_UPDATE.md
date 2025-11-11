# 不可变更新

FormEngine 的核心设计原则之一是不可变更新（Immutable Update）。所有数据更新都创建新对象，而不是修改原对象，确保数据可追踪、可预测。

## 为什么需要不可变更新

### 1. 数据可追踪

不可变更新使得每次变化都创建新引用，可以轻松追踪数据变化。

```typescript
const oldData = engine.getValue()

engine.updateValue('name', 'John')
await engine.waitFlush()

const newData = engine.getValue()

// 引用不同，说明数据已改变
console.log(oldData !== newData)  // true

// 可以保留历史版本
const history = [oldData, newData]
```

### 2. 性能优化

通过引用比较，快速判断是否需要重新渲染。

```typescript
// React 示例
function MyComponent({ renderNode }) {
  // 引用未变，跳过渲染
  return useMemo(() => {
    return <div>{renderNode.prop}</div>
  }, [renderNode])  // renderNode 引用作为依赖
}
```

### 3. 时间旅行

可以轻松实现撤销/重做功能。

```typescript
const history: any[] = []
let currentIndex = 0

// 记录每次更新
engine.onValueChange(() => {
  const snapshot = engine.getValue()
  history.push(snapshot)
  currentIndex = history.length - 1
})

// 撤销
function undo() {
  if (currentIndex > 0) {
    currentIndex--
    engine.reset(history[currentIndex])
  }
}

// 重做
function redo() {
  if (currentIndex < history.length - 1) {
    currentIndex++
    engine.reset(history[currentIndex])
  }
}
```

### 4. 并发安全

不可变数据天然线程安全，不会出现竞态条件。

## 实现原理

### ModelManager 的不可变更新

ModelManager 使用不可变更新工具函数更新 model。

```typescript
class ModelManager {
  private model: any
  
  setValue(path: string, value: any): ValueChange {
    const prevValue = this.getValue(path)
    
    // 🔥 不可变更新：创建新的 model 引用
    this.model = setByPathImmutable(this.model, path, value)
    
    return {
      path,
      prevValue,
      nextValue: value
    }
  }
}
```

### setByPathImmutable 实现

```typescript
function setByPathImmutable(obj: any, path: string, value: any): any {
  const segments = path.split('.')
  return setBySegments(obj, segments, value)
}

function setBySegments(obj: any, segments: string[], value: any): any {
  if (segments.length === 0) {
    return value
  }
  
  const [first, ...rest] = segments
  
  // 数组处理
  if (Array.isArray(obj)) {
    const index = parseInt(first, 10)
    // 🔥 创建新数组
    const newArray = [...obj]
    
    if (rest.length === 0) {
      newArray[index] = value
    } else {
      newArray[index] = setBySegments(obj[index], rest, value)
    }
    
    return newArray
  }
  
  // 对象处理
  // 🔥 创建新对象
  return {
    ...obj,
    [first]: rest.length === 0
      ? value
      : setBySegments(obj[first] || {}, rest, value)
  }
}
```

### 示例

```typescript
const oldModel = {
  name: 'Alice',
  age: 25,
  address: {
    city: 'Beijing'
  }
}

// 更新 address.city
const newModel = setByPathImmutable(oldModel, 'address.city', 'Shanghai')

console.log(oldModel !== newModel)  // true (根对象引用改变)
console.log(oldModel.address !== newModel.address)  // true (address 引用改变)
console.log(oldModel.name === newModel.name)  // true (未改变的属性共享引用)

// 原对象未被修改
console.log(oldModel.address.city)  // 'Beijing'
console.log(newModel.address.city)  // 'Shanghai'
```

## 结构共享

不可变更新使用结构共享（Structural Sharing）优化性能。

### 原理

只有改变的路径创建新对象，未改变的部分复用原引用。

```typescript
const oldModel = {
  user: {
    name: 'Alice',
    age: 25
  },
  settings: {
    theme: 'dark',
    language: 'zh'
  }
}

// 只更新 user.name
const newModel = setByPathImmutable(oldModel, 'user.name', 'Bob')

// 改变的部分创建新对象
console.log(oldModel !== newModel)  // true
console.log(oldModel.user !== newModel.user)  // true

// 未改变的部分复用引用
console.log(oldModel.settings === newModel.settings)  // true
```

### 可视化

```
oldModel
├─ user ──────┐
│  ├─ name: 'Alice'
│  └─ age: 25
└─ settings ──┼──> { theme: 'dark', language: 'zh' }

↓ updateValue('user.name', 'Bob')

newModel
├─ user (新)
│  ├─ name: 'Bob'
│  └─ age: 25
└─ settings ──┘ (复用)
```

### 性能对比

```typescript
// 假设 model 有 1000 个字段
const model = { /* 1000 fields */ }

// 只更新 1 个字段
const newModel = setByPathImmutable(model, 'field1', 'new value')

// 性能对比
// ❌ 深拷贝：复制所有 1000 个字段
// ✅ 结构共享：只创建 1-2 个新对象（根对象 + 改变的对象）
```

## RenderNode 的不可变更新

ControlEngine 在计算控制属性时，也使用不可变更新。

```typescript
class ControlEngine {
  computeNode(node: RenderNode, parentComputed?: ComputedControl): RenderNode {
    // 计算新的 computed
    const computed = { /* ... */ }
    
    // 检查是否改变
    const computedChanged = !deepEqual(node.computed, computed)
    
    // 递归计算子节点
    let childrenChanged = false
    const newChildren = node.children?.map(child => {
      const newChild = this.computeNode(child, computed)
      if (newChild !== child) {
        childrenChanged = true
      }
      return newChild
    })
    
    // 如果改变，创建新节点；否则复用原节点
    if (computedChanged || childrenChanged) {
      return {
        ...node,
        computed,
        children: newChildren
      }
    }
    
    return node  // 复用
  }
}
```

### 示例

```typescript
const oldRenderNode = engine.getRenderSchema()
const oldChild = oldRenderNode.children[0]

// 更新不相关的字段
engine.updateValue('otherField', 'value')
await engine.waitFlush()

const newRenderNode = engine.getRenderSchema()
const newChild = newRenderNode.children[0]

// 未受影响的节点复用引用
console.log(oldChild === newChild)  // true

// 可以跳过重新渲染
if (oldChild === newChild) {
  console.log('节点未改变，跳过渲染')
}
```

## 数组操作的不可变更新

所有数组操作都使用不可变方式实现。

### arrayAppendImmutable

```typescript
function arrayAppendImmutable(arr: any[], item: any): any[] {
  return [...arr, item]
}

// 使用
const oldList = [1, 2, 3]
const newList = arrayAppendImmutable(oldList, 4)

console.log(oldList)  // [1, 2, 3] (未改变)
console.log(newList)  // [1, 2, 3, 4]
```

### arrayInsertImmutable

```typescript
function arrayInsertImmutable(arr: any[], index: number, item: any): any[] {
  return [
    ...arr.slice(0, index),
    item,
    ...arr.slice(index)
  ]
}

// 使用
const oldList = [1, 2, 3]
const newList = arrayInsertImmutable(oldList, 1, 99)

console.log(oldList)  // [1, 2, 3]
console.log(newList)  // [1, 99, 2, 3]
```

### arrayRemoveImmutable

```typescript
function arrayRemoveImmutable(arr: any[], index: number): any[] {
  return [
    ...arr.slice(0, index),
    ...arr.slice(index + 1)
  ]
}

// 使用
const oldList = [1, 2, 3]
const newList = arrayRemoveImmutable(oldList, 1)

console.log(oldList)  // [1, 2, 3]
console.log(newList)  // [1, 3]
```

### arrayMoveImmutable

```typescript
function arrayMoveImmutable(arr: any[], from: number, to: number): any[] {
  const newArr = [...arr]
  const [item] = newArr.splice(from, 1)
  newArr.splice(to, 0, item)
  return newArr
}

// 使用
const oldList = [1, 2, 3, 4]
const newList = arrayMoveImmutable(oldList, 0, 2)

console.log(oldList)  // [1, 2, 3, 4]
console.log(newList)  // [2, 3, 1, 4]
```

### arrayReplaceImmutable

```typescript
function arrayReplaceImmutable(arr: any[], index: number, item: any): any[] {
  const newArr = [...arr]
  newArr[index] = item
  return newArr
}

// 使用
const oldList = [1, 2, 3]
const newList = arrayReplaceImmutable(oldList, 1, 99)

console.log(oldList)  // [1, 2, 3]
console.log(newList)  // [1, 99, 3]
```

## 在 UI 框架中的应用

### React

React 通过引用比较判断是否需要重新渲染。

```typescript
import { useMemo } from 'react'

function FormField({ node }: { node: RenderNode }) {
  // 只有 node 引用改变时才重新渲染
  return useMemo(() => {
    return (
      <div>
        <label>{node.formItemProps?.label}</label>
        <Input disabled={node.computed?.disabled} />
      </div>
    )
  }, [node])
}
```

### Vue

Vue 3 也支持引用比较优化。

```vue
<script setup>
import { watchEffect } from 'vue'

const props = defineProps<{ node: RenderNode }>()

// 只有 node 引用改变时才重新执行
watchEffect(() => {
  console.log('node changed:', props.node)
})
</script>
```

## 性能考虑

### 优势

1. **快速比较** - 引用比较是 O(1) 操作
2. **避免深度比较** - 不需要递归比较所有属性
3. **结构共享** - 减少内存分配和 GC 压力
4. **便于优化** - UI 框架可以轻松优化渲染

### 劣势

1. **内存开销** - 每次更新都创建新对象
2. **学习曲线** - 开发者需要理解不可变概念

### 何时使用

FormEngine 的场景非常适合不可变更新：

- ✅ 表单数据更新频繁
- ✅ 需要追踪数据变化
- ✅ 需要优化 UI 渲染
- ✅ 数据结构不是特别深

## 最佳实践

### 1. 不要直接修改 model

```typescript
// ❌ 错误：直接修改
const model = engine.getValue()
model.name = 'John'  // 不会触发更新

// ✅ 正确：使用 updateValue
engine.updateValue('name', 'John')
```

### 2. 不要依赖引用相等性判断值是否改变

```typescript
// ❌ 错误
const oldValue = engine.getValue('name')
engine.updateValue('name', 'John')
await engine.waitFlush()
const newValue = engine.getValue('name')

// 基本类型的引用没有意义
console.log(oldValue !== newValue)  // 可能是 true 或 false

// ✅ 正确：直接比较值
console.log(oldValue !== newValue)  // 值比较
```

### 3. 利用结构共享优化渲染

```typescript
// React 组件
function UserInfo({ node }: { node: RenderNode }) {
  // node.computed 未改变时，不重新渲染
  return useMemo(() => {
    return (
      <div>
        Required: {node.computed?.required ? 'Yes' : 'No'}
      </div>
    )
  }, [node.computed])  // 只依赖 computed
}
```

### 4. 使用 waitFlush 确保更新完成

```typescript
// ❌ 错误：不等待
engine.updateValue('name', 'John')
const data = engine.getValue()  // 可能还是旧值

// ✅ 正确：等待更新
engine.updateValue('name', 'John')
await engine.waitFlush()
const data = engine.getValue()  // 新值
```

## 总结

不可变更新是 FormEngine 的核心设计原则：

1. **数据可追踪** - 每次变化都有新引用
2. **性能优化** - 快速引用比较 + 结构共享
3. **可预测性** - 数据流向清晰，易于调试
4. **便于集成** - 与现代 UI 框架完美配合

通过不可变更新，FormEngine 实现了高性能、可追踪、可预测的表单数据管理。


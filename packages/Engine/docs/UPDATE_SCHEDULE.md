# 更新调度机制

FormEngine 的更新机制基于微任务批处理和响应式更新，确保高性能和一致性。

## 核心概念

### 异步批处理

所有更新操作都是异步的，通过微任务批处理执行。

```typescript
engine.updateValue('name', 'John')  // 加入队列
engine.updateValue('age', 25)       // 加入队列
// ↓ 微任务（Promise.resolve()）
// ↓ 批量执行所有更新
await engine.waitFlush()  // 等待完成
```

**优势：**
- 合并多次更新为一次执行
- 减少不必要的重算
- 保证数据一致性

### 更新流程

```
1. 收集更新
   ├─ updateValue() → pendingUpdates
   └─ listAppend() → pendingListOperations
   
2. 调度微任务
   └─ Promise.resolve().then(flush)
   
3. flush 循环
   ├─ 处理列表操作
   │  ├─ 更新 model
   │  └─ 重建 renderNode
   ├─ 处理值更新
   │  └─ 更新 model
   ├─ 触发订阅
   │  └─ 执行 handler（可能产生新更新）
   ├─ 重算控制属性
   │  └─ 更新 renderNode.computed
   └─ 触发 onValueChange
   
4. 检查队列
   ├─ 有新更新 → 返回步骤 3
   └─ 无更新 → 完成
```

## 更新 API

### updateValue(path, value)

更新字段值。

#### 单字段更新

```typescript
engine.updateValue('name', 'John')
```

#### 嵌套字段更新

```typescript
engine.updateValue('address.city', 'Beijing')
engine.updateValue('items.0.price', 100)
```

#### 对象格式批量更新

```typescript
engine.updateValue({
  name: 'John',
  age: 25,
  'address.city': 'Beijing',
  'items.0.price': 100
})
```

#### 通配符更新

```typescript
// 更新所有行的 status 字段
engine.updateValue('items.*.status', 'active')

// 等价于：
const items = engine.getValue('items')
items.forEach((item, index) => {
  engine.updateValue(`items.${index}.status`, 'active')
})
```

### 列表操作 API

所有列表操作都会触发结构事件。

#### listAppend(listPath, row)

追加行到末尾。

```typescript
engine.listAppend('items', {
  name: 'Item 1',
  price: 100
})

await engine.waitFlush()

// items 数组最后新增一行
```

#### listInsert(listPath, index, row)

在指定位置插入行。

```typescript
engine.listInsert('items', 0, {
  name: 'First Item',
  price: 50
})

await engine.waitFlush()

// 在第 0 位插入，后续行索引 +1
```

#### listRemove(listPath, index)

删除指定行。

```typescript
engine.listRemove('items', 1)

await engine.waitFlush()

// 第 1 行被删除，后续行索引 -1
```

#### listMove(listPath, from, to)

移动行。

```typescript
engine.listMove('items', 0, 2)

await engine.waitFlush()

// 第 0 行移动到第 2 行
```

#### listSwap(listPath, a, b)

交换两行。

```typescript
engine.listSwap('items', 0, 1)

await engine.waitFlush()

// 第 0 行和第 1 行交换
```

#### listReplace(listPath, index, row)

替换指定行。

```typescript
engine.listReplace('items', 0, {
  name: 'New Item',
  price: 200
})

await engine.waitFlush()

// 第 0 行被完整替换
```

#### listClear(listPath)

清空列表。

```typescript
engine.listClear('items')

await engine.waitFlush()

// items = []
```

### waitFlush()

等待所有待处理的更新完成。

```typescript
engine.updateValue('name', 'John')
engine.updateValue('age', 25)

// 等待完成
await engine.waitFlush()

// 此时所有更新已完成，可以安全读取
const data = engine.getValue()
const renderSchema = engine.getRenderSchema()
```

**使用场景：**
- 更新后立即读取值
- 更新后立即校验
- 确保 UI 渲染前数据已更新

## UpdateScheduler

UpdateScheduler 是更新调度的核心模块。

### 职责

1. **收集更新** - 将更新加入队列
2. **调度微任务** - 安排批处理
3. **批量执行** - 执行所有更新
4. **循环检测** - 防止无限循环
5. **协调模块** - 协调各模块协作

### 队列管理

UpdateScheduler 维护两个队列：

```typescript
private pendingUpdates: Map<string, any>              // 值更新队列
private pendingListOperations: Map<string, ListOperation>  // 列表操作队列
```

**特性：**
- 使用 Map 存储，自动去重（同一路径后来的更新覆盖之前的）
- 值更新和列表操作分开处理

### 调度机制

```typescript
scheduleUpdate(path, value) {
  // 1. 加入队列
  this.pendingUpdates.set(path, value)
  
  // 2. 调度微任务（只调度一次）
  if (!this.isScheduled && !this.isFlushing) {
    this.isScheduled = true
    Promise.resolve().then(() => this.flush())
  }
}
```

**关键点：**
- `isScheduled` - 防止重复调度
- `isFlushing` - flush 期间不创建新微任务
- 微任务保证在当前宏任务结束后执行

### flush 循环

```typescript
async flush() {
  this.isFlushing = true
  const batchId = generateBatchId()
  
  // while 循环处理所有更新
  while (
    this.pendingUpdates.size > 0 ||
    this.pendingListOperations.size > 0
  ) {
    // 深度检查
    if (this.flushDepth >= this.maxDepth) {
      throw new Error('Max update depth exceeded')
    }
    this.flushDepth++
    
    // 提取当前批次
    const updates = Array.from(this.pendingUpdates.entries())
    const listOps = Array.from(this.pendingListOperations.entries())
    this.pendingUpdates.clear()
    this.pendingListOperations.clear()
    
    // 1. 处理列表操作
    for (const [listPath, { event }] of listOps) {
      this.rebuildListChildren(listPath)
      await this.subscribeManager.emit({ path: listPath, event, batchId })
    }
    
    // 2. 处理值更新
    for (const [path, value] of updates) {
      const change = this.modelManager.setValue(path, value)
      const event = { kind: 'value', prevValue: change.prevValue, nextValue: value }
      await this.subscribeManager.emit({ path, event, batchId })
    }
    
    // 3. 重算控制属性
    this.renderNode = this.controlEngine.computeAll(this.renderNode)
    
    // 4. 触发 onValueChange
    // ...
    
    // while 自动检查是否有新更新
  }
  
  this.isFlushing = false
  this.flushDepth = 0
}
```

**while 循环的作用：**
- 订阅 handler 可能产生新更新
- 新更新会加入 pendingUpdates
- while 循环继续处理，直到没有新更新

### 循环检测

为了防止无限循环，设置了最大深度限制（默认 10）。

```typescript
if (this.flushDepth >= this.maxDepth) {
  throw new UpdateSchedulerError(
    'Max update depth (10) exceeded. Possible infinite loop detected.'
  )
}
```

**常见原因：**
- 订阅互相触发（A → B → A）
- 控制属性函数中调用 updateValue
- 订阅 handler 中更新了触发源

**解决方法：**
- 在 handler 中判断值是否真正改变
- 避免循环依赖
- 增加 `maxUpdateDepth` 配置

## 不可变更新

FormEngine 的所有更新都是不可变的，确保数据可追踪。

### ModelManager

```typescript
// ❌ 可变更新（不使用）
const model = engine.getValue()
model.name = 'John'  // 直接修改

// ✅ 不可变更新
engine.updateValue('name', 'John')
// 内部创建新的 model 对象
```

### RenderNode

```typescript
// 控制属性改变时，创建新节点
const newNode = { ...oldNode, computed: newComputed }

// 未改变的节点复用引用
if (computed 未改变) {
  return oldNode  // 复用
}
```

**结构共享：**
- 只有改变的路径创建新对象
- 未改变的部分复用引用
- 减少内存分配和 GC 压力

详见 [不可变更新](./IMMUTABLE_UPDATE.md)。

## 批次（Batch）

### 批次 ID

每次 flush 循环有一个唯一的 `batchId`。

```typescript
const batchId = this.subscribeManager.generateBatchId()
// 'batch_1234567890'
```

**用途：**
- 防抖：同一批次中，带 debounce 的 handler 只执行一次
- 追踪：所有在同一次用户操作中触发的更新共享 batchId

### 批次生命周期

```
用户操作
  ↓
updateValue() → 加入队列
  ↓
微任务触发 → flush()
  ↓
生成 batchId
  ↓
处理所有更新（可能产生新更新）
  ↓
清理 batchId
  ↓
完成
```

## 性能优化

### 1. 批量更新

使用对象格式一次更新多个字段。

```typescript
// ❌ 差：触发多次 flush
engine.updateValue('name', 'John')
await engine.waitFlush()
engine.updateValue('age', 25)
await engine.waitFlush()

// ✅ 好：一次批量更新
engine.updateValue({
  name: 'John',
  age: 25
})
await engine.waitFlush()
```

### 2. 避免频繁 waitFlush

```typescript
// ❌ 差：每次都等待
for (const item of items) {
  engine.updateValue(`items.${i}.status`, 'active')
  await engine.waitFlush()  // 每次都等待
}

// ✅ 好：一次性更新
items.forEach((item, i) => {
  engine.updateValue(`items.${i}.status`, 'active')
})
await engine.waitFlush()  // 只等待一次
```

### 3. 使用通配符

```typescript
// ❌ 差：逐个更新
const items = engine.getValue('items')
items.forEach((item, i) => {
  engine.updateValue(`items.${i}.status`, 'active')
})

// ✅ 好：通配符更新
engine.updateValue('items.*.status', 'active')
```

### 4. 结构共享

不可变更新使用结构共享，减少内存开销。

```typescript
// 更新前
const oldRenderNode = engine.getRenderSchema()
const oldChild = oldRenderNode.children[0]

// 更新
engine.updateValue('otherField', 'value')
await engine.waitFlush()

// 更新后
const newRenderNode = engine.getRenderSchema()
const newChild = newRenderNode.children[0]

// 未受影响的节点复用引用
if (oldChild === newChild) {
  console.log('节点未改变，可以跳过重渲染')
}
```

## 事件通知

### ValueEvent

值变化事件。

```typescript
interface ValueEvent {
  kind: 'value'
  prevValue: any
  nextValue: any
}
```

**触发时机：**
- 调用 `updateValue()` 后

### StructureEvent

结构变化事件。

```typescript
interface StructureEvent {
  kind: 'structure'
  reason: 'add' | 'remove' | 'move' | 'replace'
  added?: Array<{ index: number }>
  removed?: Array<{ index: number }>
  moves?: Array<{ from: number; to: number }>
  reindexedIndices: number[]  // 受影响的行索引
}
```

**触发时机：**
- 调用 `listAppend()`、`listRemove()` 等列表操作后

**reindexedIndices：**
- 表示哪些行的索引发生了变化
- UI 层可以根据这个信息优化渲染

### onValueChange 监听

```typescript
engine.onValueChange((payload) => {
  console.log('变化:', payload)
  
  if (payload.event.kind === 'value') {
    console.log('值变化:', payload.event.prevValue, '→', payload.event.nextValue)
  } else {
    console.log('结构变化:', payload.event.reason)
  }
})
```

**过滤：**

```typescript
// 只监听指定路径模式
engine.onValueChange(
  (payload) => { /* ... */ },
  { pattern: 'items.*.price' }
)

// 只监听值变化
engine.onValueChange(
  (payload) => { /* ... */ },
  { kinds: ['value'] }
)
```

## 常见问题

### Q: 为什么更新是异步的？

A: 异步批处理可以：
- 合并多次更新
- 减少重复计算
- 保证数据一致性
- 提高性能

### Q: 如何确保更新完成后再读取？

A: 使用 `await engine.waitFlush()`。

```typescript
engine.updateValue('name', 'John')
await engine.waitFlush()
const name = engine.getValue('name')  // 'John'
```

### Q: 为什么会出现无限循环错误？

A: 通常是订阅互相触发。解决方法：

```typescript
// ❌ 互相触发
subscribes: {
  'A': (ctx) => {
    ctx.updateValue('B', ctx.getValue('A') + 1)
  }
}

// B 订阅 A，A 订阅 B → 死循环

// ✅ 判断值是否改变
subscribes: {
  'A': (ctx) => {
    const newValue = ctx.getValue('A') + 1
    const oldValue = ctx.getValue('B')
    if (newValue !== oldValue) {
      ctx.updateValue('B', newValue)
    }
  }
}
```

### Q: 列表操作后，renderNode 的引用会改变吗？

A: 会。列表操作会重建 list 的 children，创建新的 renderNode 引用。

```typescript
const oldRenderNode = engine.getRenderSchema()

engine.listAppend('items', { name: 'Item 1' })
await engine.waitFlush()

const newRenderNode = engine.getRenderSchema()

console.log(oldRenderNode !== newRenderNode)  // true
```




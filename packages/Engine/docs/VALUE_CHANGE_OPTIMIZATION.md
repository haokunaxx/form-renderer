# UpdateScheduler onValueChange 触发时机优化

## 问题背景

在处理 UI 组件库同步校验时，发现一个值同步问题：当用户输入触发同步校验时，校验函数获取到的值还是旧值，而不是最新输入的值。

### 原始实现

原始代码的执行流程：

```
1. 收集所有变更事件到 allChangeEvents
2. 处理列表操作
3. 处理普通字段值更新（更新模型值）
4. 执行 controlEngine.computeAll（更新 renderNode）
5. 统一触发所有 onValueChange 回调
```

**问题**：在步骤 3 更新模型值后，直到步骤 5 才触发 `onValueChange`，导致 UI 组件库的同步校验在步骤 3 执行时获取不到新值。

### 临时修复

为了解决同步校验问题，在第 252 行将普通字段的 `onValueChange` 改为立即执行：

```typescript
// 普通字段：更新值
const change = this.modelManager.setValue(path, value)
const event: ValueEvent = {
  kind: 'value',
  prevValue: change.prevValue,
  nextValue: change.nextValue
}
this.onValueChange?.({ path, event, batchId }) // 立即触发
```

同时将原本添加到 `allChangeEvents` 的代码注释掉：

```typescript
// allChangeEvents.push({ path, event, batchId })
```

**新问题**：

1. **时序不一致**：
   - 普通字段在模型更新后立即触发 `onValueChange`，此时 `renderNode` 还未更新
   - 列表操作在 `renderNode` 更新后才触发 `onValueChange`
   - 导致两种类型的更新在不同时机触发回调

2. **状态不完整**：
   - 立即触发时，`getRenderSchema()` 返回的控制属性（`required`、`disabled`、`ifShow` 等）还是旧的
   - 外部无法在 `onValueChange` 中获取到完整的最新状态

3. **事件丢失**：
   - 普通字段的事件不再添加到 `allChangeEvents`
   - 导致在 `renderNode` 更新后，普通字段的 `onValueChange` 不会被触发
   - `allChangeEvents` 只剩下列表操作的事件

## 优化方案

### 核心思路

采用**分阶段触发**策略，为 `onValueChange` 回调添加 `phase` 参数：

- **`immediate` 阶段**：值更新后立即触发
  - 时机：模型值刚更新完成，`renderNode` 还未重新计算
  - 目的：让 UI 组件能立即获取到新的模型值（解决同步校验问题）
  - 限制：控制属性（`required`、`disabled` 等）还是旧的

- **`computed` 阶段**：renderNode 更新后触发
  - 时机：`controlEngine.computeAll` 执行完成后
  - 目的：提供完整的最新状态（包括模型值和控制属性）
  - 优点：外部可以获取到所有最新信息

### 实现细节

#### 1. 更新回调接口

```typescript
private onValueChange?: (payload: {
  path: string
  event: ValueEvent | StructureEvent
  batchId: string
  phase: 'immediate' | 'computed' // 新增阶段标识
}) => void
```

#### 2. 分别收集不同类型的事件

```typescript
// 列表操作事件（只在 computed 阶段触发）
const listChangeEvents: Array<{
  path: string
  event: ValueEvent | StructureEvent
  batchId: string
}> = []

// 普通字段事件（需要触发两次：immediate 和 computed）
const valueChangeEvents: Array<{
  path: string
  event: ValueEvent | StructureEvent
  batchId: string
}> = []
```

#### 3. 执行流程

```typescript
// 1. 处理列表操作（收集事件）
for (const [listPath, { event }] of listOps) {
  this.rebuildListChildren(listPath)
  await this.subscribeManager.emit(...)
  listChangeEvents.push({ path: listPath, event, batchId })
}

// 2. 处理普通字段值更新
for (const [path, value] of updates) {
  if (schema?.type === 'list') {
    // 列表整体替换
    const event = this.listOperator.diffArray(path, value)
    this.rebuildListChildren(path)
    await this.subscribeManager.emit(...)
    listChangeEvents.push({ path, event, batchId })
  } else {
    // 普通字段
    const change = this.modelManager.setValue(path, value)
    const event = { kind: 'value', prevValue, nextValue }
    
    // 立即触发（immediate 阶段）
    this.onValueChange?.({ path, event, batchId, phase: 'immediate' })
    
    await this.subscribeManager.emit(...)
    
    // 收集事件，稍后再次触发
    valueChangeEvents.push({ path, event, batchId })
  }
}

// 3. 重算控制属性
this.renderNode = this.controlEngine.computeAll(this.renderNode)

// 4. 触发普通字段的 computed 阶段回调
for (const payload of valueChangeEvents) {
  this.onValueChange?.({ ...payload, phase: 'computed' })
}

// 5. 触发列表操作的 computed 阶段回调
for (const payload of listChangeEvents) {
  this.onValueChange?.({ ...payload, phase: 'computed' })
}
```

## 使用建议

### 外部如何处理两个阶段

```typescript
const engine = new FormEngine(schema, {
  onValueChange: ({ path, event, batchId, phase }) => {
    if (phase === 'immediate') {
      // immediate 阶段：只处理需要立即响应的逻辑
      // 例如：UI 组件库的同步校验
      // 此时模型值已更新，但控制属性可能还是旧的
      console.log('模型值已更新:', path)
    } else if (phase === 'computed') {
      // computed 阶段：处理需要完整状态的逻辑
      // 例如：触发外部的 watch、更新衍生状态、日志记录等
      // 此时模型值和控制属性都是最新的
      console.log('完整状态已更新:', path)
      
      // 可以安全地调用 getRenderSchema() 获取最新的控制属性
      const schema = engine.getRenderSchema()
    }
  }
})
```

### 典型应用场景

#### 1. UI 组件库同步校验

```typescript
if (phase === 'immediate') {
  // Element Plus、Ant Design 等组件库的同步校验
  // 在用户输入后立即执行，此时需要获取最新的模型值
  const newValue = engine.getValue(path)
  validateField(path, newValue)
}
```

#### 2. 响应式更新 UI

```typescript
if (phase === 'computed') {
  // Vue/React 的响应式更新
  // 此时 renderNode 已更新，可以触发组件重新渲染
  // 确保显示的控制属性（disabled、required 等）是最新的
  updateComponent()
}
```

#### 3. 性能优化

如果只需要在完整状态更新后执行某些操作，可以忽略 `immediate` 阶段：

```typescript
if (phase === 'computed') {
  // 只在 computed 阶段执行，减少不必要的操作
  expensiveOperation()
}
```

## 优势

1. **解决同步校验问题**：UI 组件在同步校验时能立即获取到新值
2. **保持状态一致性**：在 `computed` 阶段提供完整的最新状态
3. **向后兼容**：外部可以选择只处理某个阶段，或两个阶段都处理
4. **灵活性**：不同场景可以选择在不同阶段执行相应逻辑
5. **清晰的语义**：`phase` 参数明确表达了回调触发的时机和可用的状态

## 性能考虑

- **双重触发**：普通字段的 `onValueChange` 会被触发两次（`immediate` 和 `computed`）
- **建议**：在外部根据 `phase` 参数进行优化，避免执行重复或不必要的操作
- **列表操作**：列表操作只在 `computed` 阶段触发一次，不影响性能

## 注意事项

1. **immediate 阶段的限制**：
   - 控制属性（`required`、`disabled`、`ifShow` 等）可能还是旧值
   - `getRenderSchema()` 返回的 `renderNode` 还未更新
   - 只能安全地访问模型数据（通过 `getValue`）

2. **computed 阶段的保证**：
   - 所有状态（模型值和控制属性）都是最新的
   - 可以安全地调用任何 API（`getValue`、`getRenderSchema` 等）

3. **订阅链的影响**：
   - 如果字段 A 的变更触发了字段 B 的订阅更新
   - 字段 A 会触发两次回调（`immediate` 和 `computed`）
   - 字段 B 的更新会在下一次 while 循环中处理，同样触发两次回调
   - 所有更新共享同一个 `batchId`


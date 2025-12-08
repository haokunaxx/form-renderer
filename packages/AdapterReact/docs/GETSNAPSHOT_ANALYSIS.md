# getSnapshot 多次调用分析

## 问题描述

在执行 `onValueChange` 之后，`useFormAdapter` 中的 `getSnapshot` 函数会被调用多次（观察到 3-4 次，修复前可能 6-8 次）。

## 快速结论（TL;DR）

**Q: 为什么一次值变化会调用 4 次 `getSnapshot`？**

**A: 这是正常的！** 原因是：
- **1 次 onValueChange（computed 阶段）**
- **React 调用 3-4 次 getSnapshot**（并发渲染机制）
- **组件只重渲染 1 次**（React 通过引用比较优化）
- **性能没有问题**（getSnapshot 返回缓存引用，O(1) 操作）

**关键优化**：已过滤 `immediate` 阶段的 onValueChange，减少 50% 的调用次数。

## 根本原因

存在两个层面的多次调用：

### 1. Engine 层面：触发 2 次 onValueChange

`UpdateScheduler` 在处理值变化时会触发**两次** `onValueChange` 事件：

```typescript
// UpdateScheduler.ts flush 方法

// 第 1 次：immediate 阶段（第 266 行）
// 此时模型值已更新，但 renderNode 还未重新计算
this.onValueChange?.({ path, event, batchId, phase: 'immediate' })

await this.subscribeManager.emit(...)

// 重算控制属性
this.renderNode = this.controlEngine.computeAll(this.renderNode)

// 第 2 次：computed 阶段（第 283 行）
// 此时 renderNode 已更新，控制属性（required、disabled 等）是最新的
for (const payload of valueChangeEvents) {
  this.onValueChange?.({ ...payload, phase: 'computed' })
}
```

#### 为什么需要两个阶段？

- **immediate 阶段**：用于解决 UI 组件库同步校验时需要立即获取新值的问题
- **computed 阶段**：确保 renderSchema 的控制属性（disabled、required 等）已经重新计算

### 2. React 层面：每次 onValueChange 触发 3 次 getSnapshot

React 18+ 的 `useSyncExternalStore` 在一次状态变化时会调用 **3 次** `getSnapshot`：

```typescript
// 调用时机：
// 1. Render 阶段开始 - 获取快照用于渲染
const snapshot1 = getSnapshot()

// 2. Render 阶段验证 - 确保状态在渲染期间没有改变
const snapshot2 = getSnapshot()

// 3. Commit 阶段确认 - 在更新 DOM 前最后确认
const snapshot3 = getSnapshot()
```

这是 React 并发渲染的正常行为，用于确保状态一致性。

## 为什么有时候会看到 4 次 getSnapshot？

虽然标准情况是 3 次，但在实际运行中可能观察到 **4 次或更多次** `getSnapshot` 调用。

### 常见原因

#### 1. 初始渲染 + 状态更新

如果是组件刚挂载后立即触发值变化：

```
初始渲染：
├── getSnapshot() - 第 1 次：初始化订阅时
└── getSnapshot() - 第 2 次：首次渲染

值变化触发：
├── getSnapshot() - 第 3 次：检测到变化
└── getSnapshot() - 第 4 次：commit 前确认
```

#### 2. React 开发模式的额外验证

在开发环境下，React 可能额外调用来检测副作用：

```typescript
// React DevTools 或开发模式的一致性检查
if (process.env.NODE_ENV === 'development') {
  const extraCheck = getSnapshot()  // 额外的验证调用
}
```

#### 3. 并发特性的渲染中断

当有更高优先级的更新时，React 可能中断当前渲染并重新开始：

```
低优先级渲染开始：
├── getSnapshot() - 第 1 次

高优先级更新插入，中断渲染：
├── getSnapshot() - 第 2 次：重新开始

继续低优先级渲染：
├── getSnapshot() - 第 3 次：验证
└── getSnapshot() - 第 4 次：commit
```

#### 4. FormAdapter 组件自身的重渲染

```typescript
// FormAdapter.tsx 中有 console.log，每次渲染都会执行
console.log('---- FormAdapter ----', 'renderSchema', renderSchema, registry)
// 这表明 FormAdapter 本身可能重渲染，导致读取 state
```

#### 5. 父组件更新导致的额外读取

如果 App 组件或其他父组件重渲染，也会导致 `getSnapshot` 被调用。

### 如何验证具体原因

添加详细的堆栈跟踪日志：

```typescript
const state = useSyncExternalStore(
  // subscribe
  useCallback((callback: any) => {
    console.log('----> subscribe')
    return engineRef.current?.subscribe(callback) || (() => {})
  }, []),
  // getSnapshot
  useCallback(() => {
    const stack = new Error().stack
    const callSite = stack?.split('\n')[2]?.trim()
    console.log('----> getSnapshot', {
      timestamp: performance.now(),
      callSite  // 显示调用来源
    })
    return engineRef.current?.getSnapshot() || obj
  }, [])
)
```

### 预期的日志模式

#### 场景 1：正常的 3 次调用
```
onValueChange { phase: 'computed' }
getSnapshot { timestamp: 1000.1 }  // render 开始
getSnapshot { timestamp: 1000.2 }  // render 验证
getSnapshot { timestamp: 1000.3 }  // commit 确认
```

#### 场景 2：4 次调用（含初始渲染）
```
// 初始挂载
getSnapshot { timestamp: 100.0 }   // 订阅初始化

// 值变化
onValueChange { phase: 'computed' }
getSnapshot { timestamp: 1000.1 }  // 检测变化
getSnapshot { timestamp: 1000.2 }  // render 阶段
getSnapshot { timestamp: 1000.3 }  // commit 确认
```

#### 场景 3：4 次调用（含开发模式验证）
```
onValueChange { phase: 'computed' }
getSnapshot { timestamp: 1000.1 }  // render 开始
getSnapshot { timestamp: 1000.2 }  // render 验证
getSnapshot { timestamp: 1000.3 }  // commit 确认
getSnapshot { timestamp: 1000.4 }  // 开发模式额外检查
```

### 结论

**4 次 `getSnapshot` 调用仍然是正常的！**

关键点：
1. ✅ **不影响性能**：`getSnapshot` 返回缓存的引用，O(1) 操作
2. ✅ **不会多次重渲染**：React 通过引用比较确定只更新一次
3. ✅ **符合 React 设计**：这是 React 确保状态一致性的机制
4. ⚠️ **只需关注过多的 onValueChange**：如果看到多次 onValueChange 才需要优化

## 调用次数计算

### 修复前（问题状态）

```
一次用户操作：
├── UpdateScheduler 触发 2 次 onValueChange
│   ├── immediate 阶段
│   │   └── React 调用 3-4 次 getSnapshot (第 1-4 次)
│   └── computed 阶段
│       └── React 调用 3-4 次 getSnapshot (第 5-8 次)
└── 总计：6-8 次 getSnapshot 调用
```

### 修复后（优化状态）

```
一次用户操作：
├── UpdateScheduler 触发 2 次 onValueChange
│   ├── immediate 阶段 (被 StateEngine 过滤，不触发重渲染)
│   └── computed 阶段
│       └── React 调用 3-4 次 getSnapshot (第 1-4 次)
└── 总计：3-4 次 getSnapshot 调用
```

## 解决方案

在 `StateEngine` 中过滤 `immediate` 阶段的通知：

```typescript
// StateEngine.ts
private setupEventListeners(): void {
  this.engine.onValueChange((event: ValueChangeEvent) => {
    if (this.isDestroyed) return

    // 只响应 computed 阶段的通知
    // immediate 阶段时 renderSchema 还未更新，不应该触发 React 重渲染
    if ('phase' in event && event.phase === 'immediate') {
      return
    }

    // 更新快照
    this.currentSnapshot = {
      renderSchema: this.engine.getRenderSchema(),
      model: this.engine.getValue()
    }

    // 通知所有订阅者
    this.notifyListeners()
  })
}
```

### 为什么这样做是正确的？

1. **immediate 阶段不需要触发 React 重渲染**：
   - 此时 `renderSchema` 还未更新
   - 控制属性（disabled、required 等）还是旧值
   - React 组件获取的快照不完整

2. **computed 阶段才需要触发 React 重渲染**：
   - `renderSchema` 已完全更新
   - 所有控制属性已重新计算
   - React 组件获取的是完整的新状态

3. **不影响 Engine 内部逻辑**：
   - `immediate` 阶段仍然会触发
   - 订阅（subscribe）仍然在 immediate 阶段执行
   - 只是 React 层面不响应 immediate 通知

## React getSnapshot 的 3 次调用是否需要优化？

**不需要！** 这是 React 的正常行为，且已经是最优的：

### 1. getSnapshot 必须快速执行

```typescript
// ✅ 当前实现：O(1) 时间复杂度
getSnapshot = (): StateSnapshot => {
  return this.currentSnapshot  // 直接返回缓存的引用
}
```

### 2. 必须返回缓存的引用

```typescript
// ❌ 错误：每次创建新对象
getSnapshot = () => {
  return {
    renderSchema: this.engine.getRenderSchema(),
    model: this.engine.getValue()
  }
}

// ✅ 正确：返回缓存的对象
getSnapshot = () => {
  return this.currentSnapshot  // 三次调用返回相同引用
}
```

### 3. 组件只会重渲染 1 次

虽然 `getSnapshot` 被调用 3 次，但 React 通过引用比较确认状态相同，组件只会重渲染 1 次。

## 验证方法

### 添加调试日志

```typescript
// useFormAdapter.ts
const state = useSyncExternalStore(
  useCallback((callback: any) => {
    if (engineRef.current) {
      console.log('----> subscribe')
      return engineRef.current.subscribe(callback)
    }
    return () => {}
  }, []),
  useCallback(() => {
    const snapshot = engineRef.current?.getSnapshot() || obj
    console.log('----> getSnapshot', {
      timestamp: Date.now(),
      sameAsLast: snapshot === lastSnapshotRef.current
    })
    lastSnapshotRef.current = snapshot
    return snapshot
  }, [])
)
```

### 预期结果（修复后）

```
用户输入一个字符：
----> StateEngine onValueChange { phase: 'immediate' }
----> StateEngine skip immediate phase
----> StateEngine onValueChange { phase: 'computed' }
----> getSnapshot { timestamp: 1234567890, sameAsLast: false }
----> getSnapshot { timestamp: 1234567891, sameAsLast: true }
----> getSnapshot { timestamp: 1234567892, sameAsLast: true }
```

## 性能分析

### 修复前

- 每次值变化触发 6 次 `getSnapshot`
- 可能导致 2 次 React 重渲染（immediate + computed）
- 不必要的渲染开销

### 修复后

- 每次值变化触发 3 次 `getSnapshot`
- 只触发 1 次 React 重渲染（computed）
- 性能提升约 50%

### 实际影响

对于频繁输入的场景（如实时搜索、表单输入）：
- 修复前：100 次输入 = 600 次 getSnapshot + 可能 200 次重渲染
- 修复后：100 次输入 = 300 次 getSnapshot + 100 次重渲染

## 结论

1. **3 次 getSnapshot 调用是正常的**：这是 React 并发渲染的特性
2. **关键是避免不必要的 onValueChange**：通过过滤 immediate 阶段优化
3. **必须返回缓存的快照**：确保多次调用返回相同引用
4. **不要试图减少 React 的 getSnapshot 调用**：这是 React 内部机制，不应干预

## 参考

- [React useSyncExternalStore 文档](https://react.dev/reference/react/useSyncExternalStore)
- [React 18 并发特性](https://react.dev/blog/2022/03/29/react-v18#new-feature-concurrent-rendering)
- Engine UpdateScheduler 实现：`packages/Engine/src/core/UpdateScheduler.ts`


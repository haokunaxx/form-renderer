# API 文档

FormEngine 的完整 API 参考文档。

## 构造函数

### FormEngine(options)

创建 FormEngine 实例。

```typescript
const engine = new FormEngine(options: FormEngineOptions)
```

**参数：**

```typescript
interface FormEngineOptions {
  /** JSON Schema */
  schema: JsonSchemaNode
  /** 初始 FormModel */
  model?: any
  /** 隐藏字段策略：keep 保留值，remove 清除值 */
  hiddenFieldPolicy?: 'keep' | 'remove'
  /** 最大更新深度，防止死循环 */
  maxUpdateDepth?: number
}
```

**示例：**

```typescript
const engine = new FormEngine({
  schema: {
    type: 'form',
    properties: {
      name: { type: 'field' }
    }
  },
  model: { name: '' },
  maxUpdateDepth: 10
})
```

## 数据操作

### getValue(path?)

获取指定路径的值。

```typescript
getValue(path?: string): any
```

**参数：**
- `path` - 路径，不传或传空字符串则返回整个 model

**返回：** 路径对应的值，路径不存在返回 `undefined`

**示例：**

```typescript
// 获取整个 model
const data = engine.getValue()

// 获取指定字段
const name = engine.getValue('name')

// 获取嵌套字段
const city = engine.getValue('address.city')

// 获取列表项
const firstItem = engine.getValue('items.0')
const itemName = engine.getValue('items.0.name')
```

### updateValue(path, value)

更新指定路径的值（异步批处理）。

```typescript
updateValue(path: string | Record<string, any>, value?: any): void
```

**参数：**
- `path` - 路径或对象
- `value` - 值（path 为字符串时必需）

**示例：**

```typescript
// 单字段更新
engine.updateValue('name', 'John')

// 对象格式批量更新
engine.updateValue({
  name: 'John',
  age: 25,
  'address.city': 'Beijing'
})

// 通配符更新（更新所有行的某个字段）
engine.updateValue('items.*.status', 'active')

// 等待更新完成
await engine.waitFlush()
```

## Schema 操作

### getSchema(path?)

获取指定路径的 Schema 节点。

```typescript
getSchema(path?: string): SchemaNode | undefined
```

**参数：**
- `path` - 路径，不传则返回整个 Schema

**返回：** SchemaNode 或 undefined

**示例：**

```typescript
// 获取整个 Schema
const rootSchema = engine.getSchema()

// 获取指定节点的 Schema
const nameSchema = engine.getSchema('name')

// 注意：传入 Render path，会自动转换为 Schema path
const fieldSchema = engine.getSchema('items.0.name')
// 等价于 Schema path: 'items.items.name'
```

### getRenderSchema()

获取渲染树（RenderNode）。

```typescript
getRenderSchema(): RenderNode
```

**返回：** 渲染树根节点

**RenderNode 结构：**

```typescript
interface RenderNode {
  type: NodeType
  prop?: string
  path: string
  
  // 原始控制属性
  required?: ControlAttr
  disabled?: ControlAttr
  readonly?: ControlAttr
  ifShow?: ControlAttr
  show?: ControlAttr
  
  // 已计算的控制属性
  computed?: {
    required: boolean
    disabled: boolean
    readonly: boolean
    ifShow: boolean
    show: boolean
  }
  
  // 子节点
  children?: RenderNode[] | RenderNode[][]
  
  // UI 属性
  component?: string
  componentProps?: any
  formItemProps?: any
  
  // 校验器
  validators?: ValidatorFn[]
  
  [key: string]: any
}
```

**示例：**

```typescript
const renderSchema = engine.getRenderSchema()

// 访问计算后的控制属性
console.log(renderSchema.children[0].computed.required)  // true/false
console.log(renderSchema.children[0].computed.ifShow)    // true/false

// 遍历所有字段
function traverse(node: RenderNode) {
  if (node.type === 'field') {
    console.log(`Field: ${node.path}, Required: ${node.computed?.required}`)
  }
  
  if (node.children) {
    if (node.type === 'list') {
      // list children 是二维数组
      for (const row of node.children as RenderNode[][]) {
        for (const child of row) {
          traverse(child)
        }
      }
    } else {
      // form/layout children 是一维数组
      for (const child of node.children as RenderNode[]) {
        traverse(child)
      }
    }
  }
}

traverse(renderSchema)
```

### setFormSchema(schema)

动态更新整个 Schema（保持 model 不变）。

```typescript
setFormSchema(schema: JsonSchemaNode): void
```

**参数：**
- `schema` - 新的 JSON Schema

**示例：**

```typescript
// 动态切换表单结构
const newSchema = {
  type: 'form',
  properties: {
    email: { type: 'field', required: true }
  }
}

engine.setFormSchema(newSchema)
```

## 列表操作

### listAppend(listPath, row)

追加行到列表末尾。

```typescript
listAppend(listPath: string, row: any): void
```

**参数：**
- `listPath` - 列表路径
- `row` - 新行数据

**示例：**

```typescript
engine.listAppend('items', { name: 'Item 1', price: 100 })
await engine.waitFlush()
```

### listInsert(listPath, index, row)

在指定位置插入行。

```typescript
listInsert(listPath: string, index: number, row: any): void
```

**参数：**
- `listPath` - 列表路径
- `index` - 插入位置
- `row` - 新行数据

**示例：**

```typescript
// 在第 0 位插入
engine.listInsert('items', 0, { name: 'First Item', price: 50 })
await engine.waitFlush()
```

### listRemove(listPath, index)

删除指定行。

```typescript
listRemove(listPath: string, index: number): void
```

**参数：**
- `listPath` - 列表路径
- `index` - 行索引

**示例：**

```typescript
// 删除第 1 行
engine.listRemove('items', 1)
await engine.waitFlush()
```

### listMove(listPath, from, to)

移动行。

```typescript
listMove(listPath: string, from: number, to: number): void
```

**参数：**
- `listPath` - 列表路径
- `from` - 源索引
- `to` - 目标索引

**示例：**

```typescript
// 将第 0 行移动到第 2 行
engine.listMove('items', 0, 2)
await engine.waitFlush()
```

### listSwap(listPath, a, b)

交换两行。

```typescript
listSwap(listPath: string, a: number, b: number): void
```

**参数：**
- `listPath` - 列表路径
- `a` - 第一个索引
- `b` - 第二个索引

**示例：**

```typescript
// 交换第 0 行和第 1 行
engine.listSwap('items', 0, 1)
await engine.waitFlush()
```

### listReplace(listPath, index, row)

替换指定行。

```typescript
listReplace(listPath: string, index: number, row: any): void
```

**参数：**
- `listPath` - 列表路径
- `index` - 行索引
- `row` - 新行数据

**示例：**

```typescript
engine.listReplace('items', 0, { name: 'New Item', price: 200 })
await engine.waitFlush()
```

### listClear(listPath)

清空列表。

```typescript
listClear(listPath: string): void
```

**参数：**
- `listPath` - 列表路径

**示例：**

```typescript
engine.listClear('items')
await engine.waitFlush()
```

## 校验

### validate(paths?)

校验表单。

```typescript
validate(paths?: string | string[]): Promise<ValidationResult>
```

**参数：**
- `paths` - 可选的路径或路径数组，不传则校验所有字段

**返回：** 校验结果

```typescript
type ValidationResult = true | ValidationResultError

interface ValidationResultError {
  ok: false
  errors: FieldError[]
  errorByPath: Record<string, FieldError[]>
}

interface FieldError {
  path: string
  message: string
  code?: string
}
```

**示例：**

```typescript
// 校验所有字段
const result = await engine.validate()

if (result === true) {
  console.log('校验通过')
} else {
  console.log('校验失败')
  
  // 遍历所有错误
  result.errors.forEach(error => {
    console.log(`${error.path}: ${error.message}`)
  })
  
  // 按路径查询错误
  const nameErrors = result.errorByPath['name']
  if (nameErrors) {
    console.log('name 字段错误:', nameErrors[0].message)
  }
}

// 校验指定字段
const nameResult = await engine.validate('name')

// 校验多个字段
const result2 = await engine.validate(['name', 'age', 'email'])
```

**校验规则：**

1. 自动跳过 `ifShow=false` 的字段
2. 自动跳过 `disabled=true` 的字段
3. 先执行 `required` 校验
4. 再执行自定义 `validators`（按顺序执行，遇到第一个错误即停止）
5. 支持异步校验器

## 表单重置

### reset(nextModel?, options?)

重置表单到初始状态或指定状态。

```typescript
reset(nextModel?: any, options?: ResetOptions): void
```

**参数：**
- `nextModel` - 可选的新 model，不传则重置到初始值
- `options` - 重置选项

```typescript
interface ResetOptions {
  keepDirty?: boolean    // 是否保留脏态标记
  keepTouched?: boolean  // 是否保留触碰标记
}
```

**示例：**

```typescript
// 重置到初始值
engine.reset()

// 重置到指定值
engine.reset({ name: 'New Name', age: 30 })

// 带选项的重置
engine.reset(undefined, { keepDirty: true })
```

### clear()
# 表单清空方法（clear）

## 概述

`clear()` 方法用于清空表单中的所有值，但**保持当前的结构不变**。这与 `reset()` 方法有本质区别：
- `reset()`：恢复到初始的 model 和 schema 结构
- `clear()`：只清空值，保持当前结构（特别是动态列表操作后的结构）

## 适用场景

### 典型场景

**动态列表场景**：
```typescript
// 初始状态：列表有 1 条数据
const initialModel = {
  list: [{ name: 'Item 1', age: 20 }]
}

// 用户操作：添加了 2 条数据
engine.listAppend('list', { name: 'Item 2', age: 25 })
engine.listAppend('list', { name: 'Item 3', age: 30 })

// 此时列表有 3 条数据
// model = { list: [{ name: 'Item 1', age: 20 }, { name: 'Item 2', age: 25 }, { name: 'Item 3', age: 30 }] }

// 使用 reset() - 会恢复到初始的 1 条数据
engine.reset()
// 结果：list = [{ name: 'Item 1', age: 20 }]

// 使用 clear() - 保持 3 条数据的结构，只清空值
engine.clear()
// 结果：list = [{ name: '', age: undefined }, { name: '', age: undefined }, { name: '', age: undefined }]
```

### 其他场景

- 表单提交成功后，需要保持当前结构继续录入
- 复杂表单中，用户想快速清空所有内容但保持已配置的结构
- 多步骤表单中，某一步需要清空值但不改变结构

---

## API 文档

### FormEngine.clear()

清空表单中的所有值，保持当前结构不变。

**类型签名**：
```typescript
clear(): void
```

**参数**：无

**返回值**：无

**示例**：
```typescript
import { FormEngine } from '@form-renderer/engine'

const engine = new FormEngine({
  schema: mySchema,
  model: {
    name: 'John',
    age: 25,
    list: [
      { item: 'A', count: 1 },
      { item: 'B', count: 2 }
    ]
  }
})

// 清空所有值
engine.clear()

// 结果
engine.getValue()
// {
//   name: '',
//   age: undefined,
//   list: [
//     { item: '', count: undefined },
//     { item: '', count: undefined }
//   ]
// }
```

---

### ReactiveEngine.clear()

清空表单中的所有值，保持当前结构不变。会自动触发 Vue 响应式更新。

**类型签名**：
```typescript
clear(): void
```

**参数**：无

**返回值**：无

**示例**：
```typescript
import { createReactiveEngine } from '@form-renderer/adapter-vue3-vue'

const reactiveEngine = createReactiveEngine({
  schema: mySchema,
  model: {
    name: 'John',
    age: 25,
    list: [
      { item: 'A', count: 1 },
      { item: 'B', count: 2 }
    ]
  }
})

// 清空所有值
reactiveEngine.clear()

// 响应式数据会自动更新
console.log(reactiveEngine.getModel().value)
// {
//   name: '',
//   age: undefined,
//   list: [
//     { item: '', count: undefined },
//     { item: '', count: undefined }
//   ]
// }
```

---

## clear() 与 reset() 对比

| 特性 | clear() | reset() |
|------|---------|---------|
| **值** | 清空为空值 | 恢复到初始值 |
| **Schema 结构** | 保持当前结构 | 恢复到初始结构 |
| **动态列表** | 保持当前长度和结构 | 恢复到初始长度和结构 |
| **适用场景** | 需要保持结构，只清空值 | 需要完全重置到初始状态 |

### 示例对比

```typescript
// 初始状态
const initialModel = {
  name: 'John',
  list: [{ item: 'A' }]
}

const engine = new FormEngine({
  schema: mySchema,
  model: initialModel
})

// 用户操作：修改值并添加列表项
engine.updateValue('name', 'Jane')
engine.listAppend('list', { item: 'B' })
engine.listAppend('list', { item: 'C' })

// 当前状态
engine.getValue()
// { name: 'Jane', list: [{ item: 'A' }, { item: 'B' }, { item: 'C' }] }

// 使用 clear()
engine.clear()
engine.getValue()
// { name: '', list: [{ item: '' }, { item: '' }, { item: '' }] }
// 注意：列表仍然是 3 项

// 使用 reset()
engine.reset()
engine.getValue()
// { name: 'John', list: [{ item: 'A' }] }
// 注意：完全恢复到初始状态
```

---

## 值清空规则

`clear()` 方法根据值的类型采用不同的清空策略：

### 基本类型

| 类型 | 清空后的值 |
|------|-----------|
| `string` | `''` (空字符串) |
| `number` | `undefined` |
| `boolean` | `undefined` |
| `null` | `null` (保持不变) |
| `undefined` | `undefined` (保持不变) |

### 复合类型

- **数组**：保持数组长度，递归清空每个元素
- **对象**：保持对象结构，递归清空所有属性

### 示例

```typescript
const model = {
  // 基本类型
  name: 'John',          // → ''
  age: 25,               // → undefined
  isActive: true,        // → undefined
  empty: null,           // → null
  
  // 数组
  tags: ['a', 'b', 'c'], // → ['', '', '']
  scores: [80, 90, 100], // → [undefined, undefined, undefined]
  
  // 对象
  address: {
    city: 'Beijing',     // → { city: '', zip: undefined }
    zip: 100000
  },
  
  // 嵌套结构
  list: [
    { name: 'Item 1', count: 5 },
    { name: 'Item 2', count: 10 }
  ]
  // → [
  //     { name: '', count: undefined },
  //     { name: '', count: undefined }
  //   ]
}

engine.clear()
// 结果如上述注释所示
```

---

## 注意事项

1. **不可逆操作**：`clear()` 操作不可撤销，执行后原有的值将丢失（除非在调用前手动保存）

2. **触发更新**：`clear()` 会触发所有字段的值变化事件，订阅这些字段的逻辑都会被执行

3. **与校验的关系**：清空后，如果字段有 `required` 规则，校验将会失败

4. **性能考虑**：对于大型表单或深层嵌套结构，`clear()` 可能需要一定时间来遍历和清空所有值

5. **引用更新**：在 ReactiveEngine 中，`clear()` 会触发响应式更新，UI 会自动重新渲染

---

## 实现原理

### ModelManager.clear()

1. 递归遍历当前 model
2. 根据值类型应用清空规则
3. 计算变更集合（diffModels）
4. 更新 model 引用

### FormEngine.clear()

1. 调用 `ModelManager.clear()` 清空值
2. 获取变更集合
3. 通过 `UpdateScheduler` 调度更新
4. 触发订阅和控制属性重新计算

### ReactiveEngine.clear()

1. 调用 `FormEngine.clear()`
2. 更新响应式引用 `modelRef`
3. 手动触发 Vue 响应式更新 (`triggerRef`)

---

## 监听

### onValueChange(handler, options?)

监听值变化。

```typescript
onValueChange(
  handler: (payload: {
    path: string
    event: ValueEvent | StructureEvent
    batchId: string
  }) => void,
  options?: OnValueChangeOptions
): () => void
```

**参数：**
- `handler` - 处理函数
- `options` - 监听选项

```typescript
interface OnValueChangeOptions {
  pattern?: string                          // 路径模式
  kinds?: Array<'value' | 'structure'>      // 事件类型过滤
}

interface ValueEvent {
  kind: 'value'
  prevValue: any
  nextValue: any
}

interface StructureEvent {
  kind: 'structure'
  reason: 'add' | 'remove' | 'move' | 'replace'
  added?: Array<{ index: number }>
  removed?: Array<{ index: number }>
  moves?: Array<{ from: number; to: number }>
  reindexedIndices: number[]
}
```

**返回：** 取消订阅函数

**示例：**

```typescript
// 监听所有变化
const unsubscribe = engine.onValueChange((payload) => {
  console.log('变化:', payload.path, payload.event)
})

// 监听指定路径模式
engine.onValueChange(
  (payload) => {
    console.log('列表项变化:', payload.path)
  },
  { pattern: 'items.*.name' }
)

// 只监听值变化（不监听结构变化）
engine.onValueChange(
  (payload) => {
    console.log('值变化:', payload.path)
  },
  { kinds: ['value'] }
)

// 取消监听
unsubscribe()
```

## 工具方法

### waitFlush()

等待所有待处理的更新完成。

```typescript
waitFlush(): Promise<void>
```

**示例：**

```typescript
engine.updateValue('name', 'John')
engine.updateValue('age', 25)

// 等待所有更新完成
await engine.waitFlush()

// 此时可以安全地读取最新值
const renderSchema = engine.getRenderSchema()
```

### destroy()

销毁引擎实例，释放资源。

```typescript
destroy(): void
```

**示例：**

```typescript
engine.destroy()

// 销毁后调用其他方法会抛出错误
engine.getValue() // ❌ Error: FormEngine has been destroyed
```

## 类型定义

### Context

控制属性函数和校验器函数的上下文。

```typescript
interface Context {
  path: string                          // 当前节点路径
  getSchema: (path?: string) => any     // 获取 Schema
  getValue: (path?: string) => any      // 获取值
  getCurRowValue: () => any             // 获取当前行值
  getCurRowIndex: () => number          // 获取当前行索引
}
```

### SubscribeHandlerContext

订阅处理函数的上下文。

```typescript
interface SubscribeHandlerContext {
  // 路径信息
  path: string                          // 触发路径
  target: string                        // 订阅目标
  subscriberPath: string                // 订阅者路径
  
  // 事件信息
  event: ValueEvent | StructureEvent
  match?: {
    pattern: string
    stars: string[]
  }
  batchId: string
  
  // 读取方法
  getSchema: (path?: string) => any
  getValue: (path?: string) => any
  getCurRowValue: () => any
  getCurRowIndex: () => number
  
  // 写入方法
  updateValue: (path: string | Record<string, any>, value?: any) => void
  updateSelf: (value: any) => void
}
```

## 错误处理

FormEngine 会抛出以下错误：

### FormEngineError

引擎级别的错误。

```typescript
try {
  engine.getValue() // 在 destroy 之后调用
} catch (error) {
  if (error instanceof FormEngineError) {
    console.error('引擎错误:', error.message)
  }
}
```

### UpdateSchedulerError

更新调度错误（如无限循环）。

```typescript
try {
  await engine.waitFlush()
} catch (error) {
  if (error instanceof UpdateSchedulerError) {
    console.error('更新错误:', error.message)
    // Max update depth (10) exceeded. Possible infinite loop detected.
  }
}
```

### SchemaValidationError

Schema 格式错误。

```typescript
try {
  new FormEngine({ schema: invalidSchema })
} catch (error) {
  if (error instanceof SchemaValidationError) {
    console.error('Schema 错误:', error.message)
  }
}
```


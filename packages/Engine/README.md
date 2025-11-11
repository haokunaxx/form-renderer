# FormEngine

FormEngine 是一个强大的表单引擎，基于 JSON Schema 驱动的声明式表单系统。它提供了完整的表单管理能力，包括数据管理、控制属性计算、订阅系统、列表操作和校验等功能。

## 项目结构
详见 [项目结构文档](./docs/PROJECT_STRUCTURE.md)。

## 核心特性

### 1. 声明式 Schema
- 使用 JSON Schema 定义表单结构
- 支持四种节点类型：`form`、`layout`、`list`、`field`
- 支持嵌套结构和动态列表

### 2. 响应式数据管理
- 基于路径的数据访问
- **不可变更新机制，确保数据可追踪**
- 支持批量更新和对象格式更新

### 3. 控制属性系统
- 支持 `required`、`disabled`、`readonly`、`ifShow`、`show` 五种控制属性
- 支持静态值、函数和对象三种定义方式
- 自动计算和继承规则

### 4. 订阅系统
- 支持精确路径、通配符和相对路径订阅
- 自动防抖和批次管理
- 支持链式响应

### 5. 列表操作
- 提供丰富的列表操作 API：`append`、`insert`、`remove`、`move`、`swap`、`replace`、`clear`
- **结构事件通知机制**
- 自动重建渲染树

### 6. 表单校验
- 支持必填校验和自定义校验器
- 异步校验支持
- 智能过滤隐藏（`ifShow === false`)和禁用(`disabled === true`)字段

### 7. 更新调度机制(🌟)
- 微任务批处理机制
- 循环检测和最大深度保护
- 统一的 flush 流程


## 架构设计

FormEngine 采用模块化架构，核心模块包括：

```
FormEngine
├── SchemaParser        # Schema 解析
├── ModelManager        # 数据模型管理
├── RenderSchemaBuilder # 渲染树构建
├── ControlEngine       # 控制属性计算
├── SubscribeManager    # 订阅管理
├── ListOperator        # 列表操作
├── UpdateScheduler     # 更新调度
└── Validator          # 校验器
```

每个模块职责单一，通过明确的接口协作。

## 设计原则

1. **声明式优先** - 通过 Schema 描述表单结构和行为
2. **不可变数据** - 所有数据更新都是不可变的
3. **关注点分离** - 各模块职责清晰，接口明确
4. **性能优化** - 批处理、结构共享、智能更新
5. **类型安全** - 完整的 TypeScript 类型定义
6. **可测试性** - 模块化设计便于单元测试


## 适用场景

- 复杂动态表单
- 配置化表单系统
- 低代码平台
- 表单构建器
- 数据驱动的 UI


## Schema

FormEngine 使用 JSON Schema 描述表单结构。Schema 是声明式的，定义了表单的结构、控制逻辑和校验规则。

### 节点类型
#### form - 表单根节点
表单的根节点，必须是 `type: 'form'`。
**特性：**
  - 必须有 `properties` 对象
  - 没有 `prop` 属性
  - 不能嵌套（只能作为根节点）

```typescript
{
  type: 'form',
  properties: {
    // 子节点定义
  }
}
```

#### layout - 布局容器

用于组织字段的容器节点。

**特性：**
  - 必须有 `properties` 对象
  - 可以嵌套
  - 支持控制属性（影响整个容器）

```typescript
{
  card: {
    type: 'layout',
    properties: {
      // 子节点定义
    }
  }
}
```
#### list - 动态列表
动态数组节点，支持增删改查操作。

**特性：**
  - 必须有 `items` 对象（定义每行的结构）
  - 对应的 model 数据必须是数组
  - 支持列表操作 API

```typescript
{
  list: {
    type: 'list',
    items: {
      // 子节点定义
    }
  }
}
```

#### field - 字段节点

表单字段，叶子节点。

**特性：**
  - 不能有 `properties` 或 `items`
  - 支持校验器
  - 支持控制属性

```typescript
{
  fieldA: {
    type: 'field',
  }
}
```

### Schema阶段
**OriginSchema -> ParsedSchema -> RenderSchema**

### 路径系统

#### Schema 路径

Schema 路径使用 `.` 分隔，`items` 表示列表项：

```
form → ''
name → 'name'
list → 'list'
list.items → 'list.items'
list.items.field → 'list.items.field'
```

#### Render 路径

Render 路径是实例化后的路径，数组索引替代 `items`：

```
form → ''
name → 'name'
list → 'list'
list[0] → 'list.0'
list[0].field → 'list.0.field'
```


## 控制属性

五种控制属性，控制节点的显示和交互状态。
### 属性说明

| 属性 | 说明 | 默认值 | 继承规则 |
|------|------|--------|----------|
| `required` | 必填 | `false` | 不继承 |
| `disabled` | 禁用 | `false` | 任一祖先为 `true` 则继承为 `true` |
| `readonly` | 只读 | `false` | 任一祖先为 `true` 则继承为 `true` |
| `ifShow` | 条件显示 | `true` | 任一祖先为 `false` 则继承为 `false` |
| `show` | 显示/隐藏 | `true` | 不继承 |

### required-必填
标记字段是否必填。

**特性：**
- 不继承父节点状态
- 影响校验：必填字段不能为空
- 通常由 UI 层必填标记（如红色星号）

### disabled-禁用
禁用字段，用户无法编辑。

**特性：**
- 向下继承：父节点禁用，子节点全部禁用
- **禁用字段跳过校验**
- UI 层渲染为不可编辑状态

### readonly - 只读
字段只读，用户无法编辑（但可以选择/复制）。

**特性：**
- 向下继承：父节点只读，子节点全部只读
- **只读字段参与校验**
- 与 `disabled` 的区别：只读通常不影响样式，只是不可编辑

### ifShow - 条件显示
根据条件控制节点是否显示。

**特性：**
- 向下继承：父节点不显示，子节点全部不显示
- 不显示的字段跳过校验
- UI 层完全移除不显示的节点（不渲染 DOM）

### show - 显示/隐藏
控制节点的显示/隐藏。

**特性：**
- 不继承父节点状态
- 隐藏的字段参与校验（与 `ifShow` 的区别）
- UI 层隐藏节点（通过 `display: none`），但保留在 DOM 中

### 定义方式

支持三种定义方式：

 1. 静态值

```typescript
{
  type: 'field',
  required: true,
  disabled: false
}
```

 2. 函数

```typescript
{
  type: 'field',
  ifShow: (ctx) => ctx.getValue('userType') === 'vip'
}
```

函数接收 `Context` 对象：

```typescript
interface Context {
  path: string                          // 当前节点路径
  getSchema: (path?: string) => any     // 获取 Schema
  getValue: (path?: string) => any      // 获取值
  getCurRowValue: () => any             // 获取当前行值（在 list 中）
  getCurRowIndex: () => number          // 获取当前行索引
}
```

 3. 对象格式（**目前版本暂未实现**）

```typescript
{
  type: 'field',
  disabled: {
    when: (ctx) => ctx.getValue('status') === 'locked',
    deps: ['status']  // 依赖声明（可选，用于优化）
  }
}
```

### 计算时机

控制属性在以下时机自动重新计算：

1. 初始化

引擎创建时，初次计算所有节点。

```typescript
const engine = new FormEngine({ schema, model })
// 此时已经计算了所有控制属性
const renderSchema = engine.getRenderSchema()
console.log(renderSchema.children[0].computed.required)
```

2. 值更新后

任何值更新后，自动重算。

```typescript
engine.updateValue('userType', 'company')
await engine.waitFlush()

// 此时控制属性已重算
const renderSchema = engine.getRenderSchema()
// companyInfo.computed.ifShow 已更新
```

3. 列表操作后

列表增删改后，受影响的行会重算。

```typescript
engine.listAppend('items', { name: 'Item 1' })
await engine.waitFlush()

// 新增行的控制属性已计算
```

### 访问计算结果

控制属性计算结果存储在 `RenderNode.computed` 中。

```typescript
const renderSchema = engine.getRenderSchema()

// 访问根节点的第一个子节点
const firstChild = renderSchema.children[0]

// 读取计算后的控制属性
console.log(firstChild.computed.required)   // true/false
console.log(firstChild.computed.disabled)   // true/false
console.log(firstChild.computed.readonly)   // true/false
console.log(firstChild.computed.ifShow)     // true/false
console.log(firstChild.computed.show)       // true/false
```

**注意：**
- 原始定义存储在 `node.required`、`node.disabled` 等
- 计算结果存储在 `node.computed` 中
- UI 层应该使用 `computed` 的值

### 性能优化

#### 避免频繁重算

控制属性函数会在每次值变化时执行，应该：

1. **保持函数简单** - 避免复杂计算
2. **避免副作用** - 不要在函数中修改状态
3. **使用缓存** - 对于昂贵的计算，可以在外部缓存

**反例：**

```typescript
// ❌ 不要在控制属性函数中做复杂计算
ifShow: (ctx) => {
  const items = ctx.getValue('items')
  // 复杂计算
  const sum = items.reduce((acc, item) => {
    return acc + calculateComplexValue(item)
  }, 0)
  return sum > 1000
}
```

**正例：**

```typescript
// ✅ 使用订阅提前计算，控制属性只做简单判断
{
  type: 'field',
  prop: 'total',
  subscribes: {
    'items': (ctx) => {
      // 在订阅中做复杂计算
      const items = ctx.getValue('items')
      const sum = items.reduce(...)
      ctx.updateValue('total', sum)
    }
  }
}

{
  type: 'field',
  prop: 'discount',
  ifShow: (ctx) => ctx.getValue('total') > 1000  // 简单判断
}
```

#### 结构共享

ControlEngine 使用不可变更新，未改变的节点会复用引用，减少内存分配。

```typescript
// 只有 computed 改变的节点会创建新对象
// 未改变的节点复用原引用
const newRenderNode = controlEngine.computeAll(oldRenderNode)

// 引用比较可以快速判断是否改变
if (newNode === oldNode) {
  console.log('节点未改变，可以跳过渲染')
}
```



## 订阅系统

订阅用于监听字段变化并执行响应逻辑。
### 基本概念

#### 订阅者与目标

- **订阅者（Subscriber）**：声明订阅的字段
- **目标（Target）**：被监听的字段
- **处理函数（Handler）**：字段变化时执行的函数

```typescript

{ // ← 当前 schema 对应的 field 即是订阅者
  type: 'field',
  subscribes: {
    'price': (ctx) => {  // ← 目标
      // ← 处理函数
      ctx.updateSelf(
        ctx.getValue('price') * ctx.getValue('quantity')
      )
    }
  }
}
```

#### 事件类型

订阅系统支持两种事件：

1. ValueEvent - 值变化事件

```typescript
interface ValueEvent {
  kind: 'value'
  prevValue: any   // 旧值
  nextValue: any   // 新值
}
```

触发时机：调用 `updateValue()` 更新字段值时。

2. StructureEvent - 结构变化事件

```typescript
interface StructureEvent {
  kind: 'structure'
  reason: 'add' | 'remove' | 'move' | 'replace'
  added?: Array<{ index: number }>
  removed?: Array<{ index: number }>
  moves?: Array<{ from: number; to: number }>
  reindexedIndices: number[]
}
```

触发时机：列表操作（append、remove 等）时。



### 定义方式

1. 对象格式

```typescript
{
  type: 'field',
  prop: 'totalPrice',
  subscribes: {
    // 订阅 price 字段
    'price': (ctx) => {
      const price = ctx.getValue('price')
      const quantity = ctx.getValue('quantity')
      ctx.updateSelf(price * quantity)
    },
    // ...
  }
}
```

2. 数组格式

```typescript
{
  type: 'field',
  prop: 'totalPrice',
  subscribes: [
    {
      target: 'price',
      handler: (ctx) => { /* ... */ },
      //  debounce: true  // 防抖选项
    },
    //...
  ]
}
```

### 路径模式
订阅支持三种路径模式：精确路径、通配符路径和相对路径。

1. 精确路径

```typescript
subscribes: {
  'name': (ctx) => { /* 订阅 name 字段 */ }
}
```

2. 通配符路径
使用通配符路径默认为**绝对路径**（从根 model开始计算）。
```typescript
subscribes: {
  'list.*.price': (ctx) => {
    // 订阅所有行的 price 字段
    // ctx.match.stars[0] 是行索引
  }
}
```
**多层嵌套：**
```typescript
'list1.*.list2.*.field'  // 订阅嵌套列表的字段
// ctx.match.stars[0] 是第一层索引
// ctx.match.stars[1] 是第二层索引
```

3. 相对路径
使用 `.` 开头，订阅同一行的其他字段（仅在 list 的 items 中有效）。

```typescript
// 在 list 的 items 中
{
  type: 'field',
  prop: 'totalPrice',
  subscribes: {
    '.price': (ctx) => {
      // 订阅同一行的 price 字段
      const price = ctx.getCurRowValue().price
      const quantity = ctx.getCurRowValue().quantity
      ctx.updateSelf(price * quantity)
    }
  }
}
```
**优势：**
- 自动绑定到当前行
- 不受行索引变化影响
- 代码更清晰

### Subscribe Context

```typescript
interface SubscribeHandlerContext {
  path: string                          // 触发路径（实际触发的目标的全路径），如 'items.1.price'
  target: string                        // 订阅目标（schema 中书写的路径），如 'items.*.price'
  subscriberPath: string                // 订阅者路径（自身），如 'totalAmount'
  event: ValueEvent | StructureEvent    // 事件
  match?: {
    pattern: string                     // 模式，如 'items.*.price'
    stars: string[]                     // 通配符匹配值，如 ['1']
  }
  batchId: string                       // 批次 ID
  
  // 读取
  getSchema: (path?: string) => any // 获取 Schema 节点
  getValue: (path?: string) => any // 获取字段值
  getCurRowValue: () => any // 获取当前行的值（在 list 中使用）
  getCurRowIndex: () => number  // 获取当前行索引（在 list 中使用）
  
  // 写入
  updateValue: (path: string, value: any) => void // 更新指定路径的值。
  updateSelf: (value: any) => void  // 更新订阅者自己的值（等价于 `ctx.updateValue(ctx.subscriberPath, value)`）
}
```


### 执行机制

##### 触发时机

订阅在以下时机触发：

1. **值更新后** - `updateValue()` 调用后
2. **列表操作后** - `listAppend()`、`listRemove()` 等调用后

```typescript
engine.updateValue('price', 100)
// ↓ 自动触发订阅 'price' 的所有订阅者

engine.listAppend('items', { name: 'Item 1' })
// ↓ 触发订阅 'items' 的订阅者
// ↓ 触发订阅 'items.*.*' 的订阅者（如果匹配）
```

##### 执行顺序

在同一批次（flush）中：

```
1. 处理列表操作 
2. 处理值更新 → 更新 model
3. 触发订阅 → 执行 handler
   ├─ 重建 renderNode
   ├─ handler 中可能调用 updateValue
   └─ 新的更新会加入队列，继续循环
4. 重算控制属性
5. 触发 onValueChange 监听器
```

##### 批次管理

所有在同一次用户操作中触发的更新共享同一个 `batchId`。

```typescript
engine.updateValue('price', 100)
// 触发订阅 'price' 的 handler
// ↓
// handler 中调用 updateValue('quantity', 2)
// ↓
// 触发订阅 'quantity' 的 handler
// ↓
// 这些都在同一个 batchId 中
```

##### 防抖（debounce）

在同一批次中，带 `debounce: true` 的 handler 只执行一次。

```typescript
subscribes: [
  {
    target: 'items',
    handler: (ctx) => {
      // 昂贵的计算
      const total = ctx.getValue('items').reduce(...)
      ctx.updateSelf(total)
    },
    debounce: true  // 同一批次只执行一次
  }
]
```

**使用场景：**
- 列表批量更新时，避免重复计算
- 订阅通配符路径，避免每行触发一次





### 性能优化

1. 使用相对路径

在 list 中使用相对路径，避免订阅所有行。

```typescript
// ❌ 差：每行都订阅所有行的 price
subscribes: {
  'items.*.price': (ctx) => { /* ... */ }
}

// ✅ 好：只订阅当前行的 price
subscribes: {
  '.price': (ctx) => { /* ... */ }
}
```

2. 使用防抖

对于昂贵的计算，使用防抖避免重复执行。

```typescript
subscribes: [
  {
    target: 'items.*.price',
    handler: (ctx) => {
      // 汇总计算
      const total = ctx.getValue('items').reduce(...)
      ctx.updateSelf(total)
    },
    debounce: true
  }
]
```

3. 提前退出

在 handler 开头判断条件，不满足时提前返回。

```typescript
subscribes: {
  'field': (ctx) => {
    // 提前退出
    if (!ctx.getValue('enabled')) return
    
    // 昂贵的计算
    const result = complexCalculation(...)
    ctx.updateSelf(result)
  }
}
```

4. 避免不必要的更新

只在值真正改变时才更新。

```typescript
subscribes: {
  'field': (ctx) => {
    const newValue = calculate(...)
    const oldValue = ctx.getValue()  // 获取自己的当前值
    
    // 只在值改变时更新
    if (newValue !== oldValue) {
      ctx.updateSelf(newValue)
    }
  }
}
```

## 校验器

字段级别的校验规则。

### 定义

```typescript
{
  type: 'field',
  prop: 'email',
  validators: [
    (value, ctx) => {
      if (!value.includes('@')) {
        return '邮箱格式不正确'
      }
    },
    async (value, ctx) => {
      // 支持异步校验
      const exists = await checkEmailExists(value)
      if (exists) {
        return { 
          path: ctx.path, 
          message: '邮箱已存在',
          code: 'email_exists'
        }
      }
    }
  ]
}
```

### 返回值

校验器可以返回：

- `void` 或 `undefined` - 校验通过
- `true` - 校验通过

- `false` - 校验失败（使用默认错误消息）
- `string` - 错误消息
- `FieldError` 对象 - 完整的错误信息

```typescript
interface FieldError {
  path: string      // 字段路径
  message: string   // 错误消息
  code?: string     // 错误代码
}
```




### 校验类型

1. 必填校验（required）

通过控制属性 `required` 标记字段必填。

```typescript
{
  type: 'field',
  prop: 'name',
  required: true  // 静态必填
}

{
  type: 'field',
  prop: 'idCard',
  required: (ctx) => ctx.getValue('userType') === 'personal'  // 动态必填
}
```

**空值判断：**

FormEngine 使用 `isEmpty()` 函数判断值是否为空：

```typescript
function isEmpty(value: any): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}
```

**示例：**

```typescript
isEmpty(undefined)  // true
isEmpty(null)       // true
isEmpty('')         // true
isEmpty('   ')      // true
isEmpty([])         // true
isEmpty(0)          // false
isEmpty(false)      // false
```

2. 自定义校验器（validators）

通过 `validators` 数组定义自定义校验规则。

```typescript
{
  type: 'field',
  prop: 'age',
  validators: [
    (value) => {
      if (value < 18) {
        return '必须年满18岁'
      }
    },
    (value) => {
      if (value > 120) {
        return '年龄不合理'
      }
    }
  ]
}
```

**校验器函数签名：**

```typescript
type ValidatorFn = (
  value: any,
  ctx: Context
) => ValidatorResult | Promise<ValidatorResult>

type ValidatorResult = string | FieldError | void | boolean
```

**返回值：**
- `void` / `undefined` - 校验通过
- `true` - 校验通过
- `false` - 校验失败（使用默认错误消息）
- `string` - 错误消息
- `FieldError` 对象 - 完整的错误信息

3. 异步校验

校验器支持异步操作。

```typescript
{
  type: 'field',
  prop: 'username',
  validators: [
    async (value, ctx) => {
      // 异步校验用户名是否存在
      const exists = await checkUsernameExists(value)
      if (exists) {
        return '用户名已存在'
      }
    }
  ]
}
```

### 校验器 Context

校验器函数接收 `Context` 对象，提供读取能力。

```typescript
interface Context {
  path: string                      // 当前字段路径
  getSchema: (path?: string) => any // 获取 Schema
  getValue: (path?: string) => any  // 获取值
  getCurRowValue: () => any         // 获取当前行值
  getCurRowIndex: () => number      // 获取当前行索引
}
```

### 自定义错误格式

#### 返回字符串

最简单的方式，返回错误消息。

```typescript
validators: [
  (value) => {
    if (value < 0) {
      return '值不能为负数'
    }
  }
]

// 错误对象：
// { path: 'field', message: '值不能为负数' }
```

#### 返回 FieldError 对象

返回完整的错误对象，可以包含错误代码。

```typescript
validators: [
  (value) => {
    if (value < 0) {
      return {
        path: 'field',
        message: '值不能为负数',
        code: 'negative_value'
      }
    }
  }
]
```

#### 返回 false

返回 `false` 表示校验失败，使用默认错误消息。

```typescript
validators: [
  (value) => {
    if (value < 0) {
      return false  // 默认消息："校验失败"
    }
  }
]
```

### 错误处理

#### 校验器抛出异常

如果校验器抛出异常，视为校验失败。

```typescript
validators: [
  (value) => {
    if (value < 0) {
      throw new Error('值不能为负数')
    }
  }
]

// 自动捕获异常，返回错误：
// {
//   path: 'field',
//   message: '值不能为负数',
//   code: 'validator_error'
// }
```

#### 异步校验错误

异步校验器的错误也会被捕获。

```typescript
validators: [
  async (value) => {
    try {
      const result = await fetch(...)
      // ...
    } catch (error) {
      return '网络错误，请重试'
    }
  }
]
```

### 集成 UI 预设（TODO)



## UI 属性

### component

组件名称（由 Adapter 层解析）。

```typescript
{
  type: 'field',
  prop: 'name',
  component: 'Input'
}
```

### componentProps

组件属性。

```typescript
{
  type: 'field',
  prop: 'age',
  component: 'InputNumber',
  componentProps: {
    min: 0,
    max: 120,
    placeholder: '请输入年龄'
  }
}
```

### formItemProps

表单项属性（如 label、layout 等）。

```typescript
{
  type: 'field',
  prop: 'name',
  formItemProps: {
    label: '姓名',
    labelWidth: '80px',
    help: '请输入真实姓名'
  }
}
```





## 更新调度机制
详见 [更新调度机制](./docs/UPDATE_SCHEDULE.md)。

## 数据流

### 初始化流程

```
new FormEngine(options)
  ↓
1. SchemaParser.parse(schema)
  → 生成 ParsedSchema
  ↓
2. new ModelManager(model)
  → 初始化 model
  ↓
3. RenderSchemaBuilder.build(schema)
  → 生成初始 renderNode
  ↓
4. ControlEngine.computeAll(renderNode)
  → 计算控制属性
  ↓
5. new SubscribeManager(subscribes)
  → 构建订阅索引
  ↓
6. new UpdateScheduler(...)
  → 准备更新调度
```

### 更新流程

```
engine.updateValue(path, value)
  ↓
UpdateScheduler.scheduleUpdate
  → 加入 pendingUpdates
  ↓
Promise.resolve() (微任务)
  ↓
UpdateScheduler.flush
  ├─> ModelManager.setValue
  │   → 更新 model（不可变）
  ├─> SubscribeManager.emit
  │   → 执行订阅 handler
  │   → handler 中可能再次 updateValue
  ├─> ControlEngine.computeAll
  │   → 重算控制属性
  │   → 更新 renderNode（不可变）
  └─> onValueChange 回调
      → 通知监听器
```

### 列表操作流程

```
engine.listAppend(listPath, row)
  ↓
ListOperator.append
  → ModelManager.setValue（不可变追加）
  → 生成 StructureEvent
  ↓
UpdateScheduler.scheduleListOperation
  ↓
UpdateScheduler.flush
  ├─> UpdateScheduler.rebuildListChildren
  │   → 重建 list 的 children
  │   → 更新 renderNode（不可变）
  ├─> SubscribeManager.emit
  │   → 派发结构事件
  ├─> ControlEngine.computeAll
  │   → 重算控制属性
  └─> onValueChange 回调
```

### 校验流程

```
engine.validate(paths)
  ↓
UpdateScheduler.waitFlush()
  → 等待所有更新完成
  ↓
Validator.validate(renderNode, paths)
  ├─> 收集需要校验的字段
  │   → 过滤 ifShow=false
  │   → 过滤 disabled=true
  ├─> 并行校验所有字段
  │   ├─> 检查 required
  │   └─> 执行 validators
  └─> 返回 ValidationResult
```



## 调试
### vitest + IDE调试工具

`.vscode/launch.json` 添加以下配置**后启动调试**
```typescript
{
	"version": "xxx",
	"configuration": [
		//...,
		{
			"name": "附加到 Vitest 进程",
			"type": "node",
			"request": "attach",
			"port": 9229,
			"skipFiles": [
				"<node_internals>/**"
			],
			"console": "integratedTerminal"
		}
	]
}
```

终端输入vitest调试命令并且添加上参数

```shell
NODE_OPTIONS='--inspect-brk' npx vitest run tests/xxx.test.ts
```


## Api
详见 [API文档](./docs/API.md)。

## 完整示例

```typescript
const schema = {
  type: 'form',
  properties: {
    userType: {
      type: 'field',
      component: 'Select',
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
          required: true,
          component: 'Input'
        },
        idCard: {
          type: 'field',
          required: (ctx) => ctx.getValue('userType') === 'personal',
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
    
    items: {
      type: 'list',
      items: {
        name: {
          type: 'field',
          required: true
        },
        price: {
          type: 'field',
          required: true,
          validators: [
            (value) => {
              if (value <= 0) return '价格必须大于0'
            }
          ]
        },
        quantity: {
          type: 'field',
          required: true
        },
        total: {
          type: 'field',
          readonly: true,
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
```
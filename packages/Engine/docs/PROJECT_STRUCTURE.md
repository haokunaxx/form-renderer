# 项目结构

## 目录结构
```
packages/Engine/
├── src/
│   ├── FormEngine.ts           # 主入口类
│   ├── types.ts                # 类型定义
│   ├── index.ts                # 导出文件
│   ├── core/                   # 核心模块
│   │   ├── SchemaParser.ts     # Schema 解析器
│   │   ├── ModelManager.ts     # 数据模型管理器
│   │   ├── RenderSchemaBuilder.ts  # 渲染树构建器
│   │   ├── ControlEngine.ts    # 控制属性计算引擎
│   │   ├── SubscribeManager.ts # 订阅管理器
│   │   ├── ListOperator.ts     # 列表操作器
│   │   ├── UpdateScheduler.ts  # 更新调度器
│   │   └── Validator.ts        # 校验器
│   └── utils/                  # 工具函数
│       ├── common.ts           # 通用工具
│       ├── immutable.ts        # 不可变更新工具
│       ├── match.ts            # 路径匹配工具
│       ├── path.ts             # 路径处理工具
│       └── index.ts            # 工具导出
├── tests/                      # 测试文件
│   ├── unit/                   # 单元测试
│   ├── integration/            # 集成测试
│   └── scenarios/              # 场景测试
├── dist/                       # 编译输出
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## 核心模块

### 1. FormEngine.ts

主入口类，负责：
- 协调各个核心模块
- 提供统一的 API 接口
- 管理引擎生命周期
- 处理监听器注册

**依赖关系：**
```
FormEngine
├─> SchemaParser
├─> ModelManager
├─> RenderSchemaBuilder
├─> ControlEngine
├─> SubscribeManager
├─> ListOperator
├─> UpdateScheduler
└─> Validator
```

**主要方法：**
- 构造函数：初始化所有模块
- `getValue()` / `updateValue()`：数据操作
- `getSchema()` / `getRenderSchema()`：Schema 访问
- `listAppend()` / `listRemove()` 等：列表操作
- `validate()`：表单校验
- `reset()` / `clear()`：重置操作
- `onValueChange()`：监听注册

### 2. SchemaParser

Schema 解析器，负责：
- 解析 JSON Schema 为内部 SchemaNode 树
- 校验 Schema 格式
- 构建路径索引（pathMap、propMap）
- 提取订阅声明

**输入：** JSON Schema
**输出：** ParsedSchema

```typescript
interface ParsedSchema {
  root: SchemaNode                          // Schema 树根节点
  propMap: Map<string, SchemaNode[]>        // prop → 节点数组
  pathMap: Map<string, SchemaNode>          // 路径 → 节点
  subscribes: SubscribeDeclaration[]        // 订阅声明
}
```

**主要方法：**
- `parse(jsonSchema)` - 解析 Schema
- `validate()` - 校验 Schema 格式
- `buildTree()` - 递归构建树
- `buildPropMap()` / `buildPathMap()` - 构建索引
- `extractSubscribes()` - 提取订阅

### 3. ModelManager

数据模型管理器，负责：
- 管理表单数据（model）
- 提供路径级别的读写操作
- 不可变更新实现
- 通配符路径展开

**核心特性：**
- 基于路径的数据访问
- 所有写操作都是不可变的
- 返回变更记录（ValueChange）

**主要方法：**
- `getValue(path)` - 读取值
- `setValue(path, value)` - 设置值（不可变）
- `deleteValue(path)` - 删除值（不可变）
- `expandWildcard(pattern)` - 展开通配符
- `reset(model)` - 重置
- `clear()` - 清空值

### 4. RenderSchemaBuilder

渲染树构建器，负责：
- 将 SchemaNode 转换为 RenderNode
- 根据 model 数据实例化列表
- 复制所有属性到 RenderNode

**转换规则：**
- `properties` → `children` 数组
- `items` → 二维数组（每行一个数组）
- Schema path → Render path（`items` → 数字索引）

**主要方法：**
- `build(root)` - 构建渲染树
- `buildNode()` - 递归构建节点
- `buildListNode()` - 构建列表节点
- `buildListRow()` - 构建列表行

### 5. ControlEngine

控制属性计算引擎，负责：
- 计算所有节点的控制属性
- 应用继承规则
- 不可变更新 RenderNode

**控制属性：**
- `required` - 必填（不继承）
- `disabled` - 禁用（继承为 true）
- `readonly` - 只读（继承为 true）
- `ifShow` - 条件显示（继承为 false）
- `show` - 显示/隐藏（不继承）

**主要方法：**
- `computeAll(renderNode)` - 全量计算
- `computeNode()` - 递归计算单个节点
- `executeControlAttr()` - 执行控制属性函数
- `buildContext()` - 构建 Context

### 6. SubscribeManager

订阅管理器，负责：
- 构建订阅索引（精确、通配符、相对路径）
- 匹配订阅
- 派发事件
- 防抖处理

**索引结构：**
```typescript
interface SubscribeIndex {
  exact: Map<string, HandlerItem[]>          // 精确路径
  pattern: Array<{                           // 通配符
    pattern: string
    compiled: CompiledPattern
    handlers: HandlerItem[]
  }>
  relative: Map<string, RelativeSubscribe[]> // 相对路径
}
```

**主要方法：**
- `buildIndex()` - 构建订阅索引
- `findHandlers(path)` - 查找匹配的订阅
- `emit(payload)` - 派发事件
- `expandSubscriberPath()` - 展开订阅者路径

### 7. ListOperator

列表操作器，负责：
- 提供列表操作 API
- 生成结构事件（StructureEvent）
- 不可变数组操作

**操作类型：**
- `append` - 追加
- `insert` - 插入
- `remove` - 删除
- `move` - 移动
- `swap` - 交换
- `replace` - 替换
- `clear` - 清空

**主要方法：**
- 各种列表操作方法（返回 StructureEvent）
- `ensureArray()` - 确保值是数组

### 8. UpdateScheduler

更新调度器，负责：
- 批处理更新
- 微任务调度
- 循环检测
- 协调更新流程

**更新流程：**
```
scheduleUpdate
  ↓
pendingUpdates (收集)
  ↓
scheduleFlush (微任务)
  ↓
flush (while 循环)
  ├─> 处理列表操作
  │   └─> rebuildListChildren
  ├─> 处理值更新
  │   └─> modelManager.setValue
  ├─> 触发订阅
  │   └─> subscribeManager.emit
  ├─> 重算控制属性
  │   └─> controlEngine.computeAll
  └─> 触发 onValueChange
```

**主要方法：**
- `scheduleUpdate()` - 调度更新
- `scheduleListOperation()` - 调度列表操作
- `flush()` - 批处理执行
- `rebuildListChildren()` - 重建列表子节点
- `waitFlush()` - 等待完成

### 9. Validator

校验器，负责：
- 执行字段校验
- 必填校验
- 自定义校验器执行
- 过滤不需要校验的字段

**校验规则：**
1. 跳过 `ifShow=false` 的字段
2. 跳过 `disabled=true` 的字段
3. 先检查 `required`
4. 再执行 `validators`（按顺序，遇到错误停止）

**主要方法：**
- `validate(renderNode, paths)` - 校验表单
- `validateField(node, value)` - 校验单个字段
- `collectFieldPaths()` - 收集所有字段路径
- `findNodeByPath()` - 查找节点

## 工具模块

### utils/common.ts

通用工具函数：
- `isPlainObject()` - 判断是否为普通对象
- `deepClone()` - 深拷贝
- `deepEqual()` - 深度比较
- `isEmpty()` - 判断是否为空值
- `getByPath()` - 根据路径读取值
- `setByPath()` - 根据路径设置值
- `deleteByPath()` - 根据路径删除值
- `flattenObject()` - 扁平化对象
- `joinPath()` - 拼接路径
- `generateId()` - 生成唯一 ID

### utils/immutable.ts

不可变更新工具：
- `setByPathImmutable()` - 不可变设置
- `deleteByPathImmutable()` - 不可变删除
- `arrayAppendImmutable()` - 不可变追加
- `arrayInsertImmutable()` - 不可变插入
- `arrayRemoveImmutable()` - 不可变删除
- `arrayMoveImmutable()` - 不可变移动
- `arraySwapImmutable()` - 不可变交换
- `arrayReplaceImmutable()` - 不可变替换
- `arrayClearImmutable()` - 不可变清空

### utils/match.ts

路径匹配工具：
- `compilePattern()` - 编译路径模式（支持通配符）
- `matchPath()` - 匹配路径
- `expandWildcard()` - 展开通配符

### utils/path.ts

路径处理工具：
- `isWildcardPath()` - 判断是否为通配符路径
- `isRelativePath()` - 判断是否为相对路径
- `normalizePath()` - 规范化路径


## 测试结构

```
tests/
├── unit/                      # 单元测试
│   ├── core/
│   │   ├── SchemaParser.test.ts
│   │   ├── ModelManager.test.ts
│   │   ├── ...
│   └── utils/
│       ├── common.test.ts
│       └── ...
├── integration/               # 集成测试
│   ├── basic-form.test.ts
│   ├── dynamic-list.test.ts
│   └── ...
└── scenarios/                 # 场景测试
    ├── complex-form.test.ts
    ├── nested-list.test.ts
    └── ...
```



## 模块职责边界

| 模块 | 读 model | 写 model | 读 schema | 写 schema | 读 renderNode | 写 renderNode |
|------|---------|---------|-----------|-----------|--------------|--------------|
| SchemaParser | ❌ | ❌ | ❌ | ✅ 解析 | ❌ | ❌ |
| ModelManager | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| RenderSchemaBuilder | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ 构建 |
| ControlEngine | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ 计算 |
| SubscribeManager | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| ListOperator | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| UpdateScheduler | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ 重建 |
| Validator | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |

import { RenderNode, StructureEvent, ValueEvent } from '../types'
import { ModelManager } from './ModelManager'
import { ControlEngine } from './ControlEngine'
import { SubscribeManager } from './SubscribeManager'
import { ListOperator } from './ListOperator'
import { RenderSchemaBuilder } from './RenderSchemaBuilder'
import { ParsedSchema } from './SchemaParser'
import { flattenObject, isPlainObject } from '../utils'
import { isWildcardPath } from '../utils/path'

/**
 * UpdateScheduler 错误类
 */
export class UpdateSchedulerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UpdateSchedulerError'
  }
}

/**
 * 列表操作项
 */
interface ListOperation {
  event: StructureEvent
}

/**
 * 更新调度器
 * 负责批处理、微任务调度、flush 流程编排
 */
export class UpdateScheduler {
  private modelManager: ModelManager
  private controlEngine: ControlEngine
  private subscribeManager: SubscribeManager
  private listOperator: ListOperator
  private parsedSchema: ParsedSchema
  private renderNode: RenderNode

  private pendingUpdates: Map<string, any>
  private pendingListOperations: Map<string, ListOperation>

  // 调度状态标志
  private isScheduled: boolean // 是否已安排微任务
  private isFlushing: boolean // 是否正在flush中

  // 深度控制
  private flushDepth: number // 循环深度（用于检测无限循环）
  private maxDepth: number // 最大深度限制

  // Promise 管理
  private flushPromise: Promise<void> | null
  private flushResolve: (() => void) | null
  private flushReject: ((error: any) => void) | null

  // onValueChange 回调
  private onValueChange?: (payload: {
    path: string
    event: ValueEvent | StructureEvent
    batchId: string
  }) => void

  /**
   * 构造函数
   */
  constructor(
    modelManager: ModelManager,
    controlEngine: ControlEngine,
    subscribeManager: SubscribeManager,
    listOperator: ListOperator,
    _renderSchemaBuilder: RenderSchemaBuilder,
    parsedSchema: ParsedSchema,
    renderNode: RenderNode,
    options?: {
      maxDepth?: number
      onValueChange?: (payload: {
        path: string
        event: ValueEvent | StructureEvent
        batchId: string
      }) => void
    }
  ) {
    this.modelManager = modelManager
    this.controlEngine = controlEngine
    this.subscribeManager = subscribeManager
    this.listOperator = listOperator
    this.parsedSchema = parsedSchema
    this.renderNode = renderNode

    this.pendingUpdates = new Map()
    this.pendingListOperations = new Map()
    this.isScheduled = false
    this.isFlushing = false
    this.flushDepth = 0
    this.maxDepth = options?.maxDepth ?? 10
    this.onValueChange = options?.onValueChange
    this.flushPromise = null
    this.flushResolve = null
    this.flushReject = null
  }

  /**
   * 调度更新
   * @param path - 路径或对象
   * @param value - 值（path 为字符串时必需）
   */
  scheduleUpdate(path: string | Record<string, any>, value?: any): void {
    // 1. 处理对象格式：{ a: 1, b: 2 }
    if (isPlainObject(path)) {
      const flat = flattenObject(path)
      for (const [p, v] of Object.entries(flat)) {
        this.pendingUpdates.set(p, v)
      }
    }
    // 2. 处理通配符路径：'list.*.field'
    else if (typeof path === 'string' && isWildcardPath(path)) {
      const paths = this.modelManager.expandWildcard(path)
      for (const p of paths) {
        this.pendingUpdates.set(p, value)
      }
    }
    // 3. 处理普通路径：'name'
    else if (typeof path === 'string') {
      this.pendingUpdates.set(path, value)
    }

    // 安排微任务
    this.scheduleFlush()
  }

  /**
   * 调度列表操作
   * @param listPath - 列表路径
   * @param event - 结构事件
   */
  scheduleListOperation(listPath: string, event: StructureEvent): void {
    this.pendingListOperations.set(listPath, { event })

    // 安排微任务
    this.scheduleFlush()
  }

  /**
   * 安排 flush
   * 如果正在flush，新的更新会被加入 pendingUpdates，在当前flush的while循环中处理
   */
  private scheduleFlush(): void {
    // 关键改动：检查 isFlushing，防止 flush 期间创建新微任务
    if (!this.isScheduled && !this.isFlushing) {
      this.isScheduled = true
      Promise.resolve()
        .then(() => this.flush())
        .catch(() => {
          // 错误已经通过 waitFlush 传播，这里忽略
          // 避免 unhandled rejection
        })
    }
  }

  /**
   * 批处理执行
   * 使用 while 循环替代递归，统一微任务调度机制
   */
  private async flush(): Promise<void> {
    // 标记开始flush，清除调度标志
    this.isFlushing = true
    this.isScheduled = false

    // 为整个 flush 周期生成一个 batchId
    // 确保同一次用户操作触发的所有更新（包括订阅链）共享同一个 batchId
    let batchId: string | null = null

    try {
      // 在 while 循环外生成 batchId（方案 A）
      batchId = this.subscribeManager.generateBatchId()

      // 使用 while 循环处理所有更新，替代递归调用
      while (
        this.pendingUpdates.size > 0 ||
        this.pendingListOperations.size > 0
      ) {
        // 深度检查（防止无限循环）
        if (this.flushDepth >= this.maxDepth) {
          const error = new UpdateSchedulerError(
            `Max update depth (${this.maxDepth}) exceeded. Possible infinite loop detected.`
          )

          // 清理状态
          this.pendingUpdates.clear()
          this.pendingListOperations.clear()
          this.flushDepth = 0

          // 通知等待者
          if (this.flushReject) {
            this.flushReject(error)
            this.flushPromise = null
            this.flushResolve = null
            this.flushReject = null
          }

          throw error
        }

        this.flushDepth++
        // 提取当前批次
        const updates = Array.from(this.pendingUpdates.entries())
        const listOps = Array.from(this.pendingListOperations.entries())
        this.pendingUpdates.clear()
        this.pendingListOperations.clear()

        // 收集所有需要触发的事件（列表操作和值更新）
        const allChangeEvents: Array<{
          path: string
          event: ValueEvent | StructureEvent
          batchId: string
        }> = []

        // 1. 处理列表操作（先收集事件，暂不触发 onValueChange）
        for (const [listPath, { event }] of listOps) {
          this.rebuildListChildren(listPath)
          await this.subscribeManager.emit(
            { path: listPath, event, batchId },
            (p, v) => this.scheduleUpdate(p, v)
            // ↑ 这里调用 scheduleUpdate 只会加入 pendingUpdates
            // 不会创建新微任务（因为 isFlushing=true）
          )

          // 收集事件，稍后统一触发
          allChangeEvents.push({ path: listPath, event, batchId })
        }

        // 2. 处理值更新（先收集所有事件，暂不触发 onValueChange）
        for (const [path, value] of updates) {
          const schema = this.getSchemaByPath(path)
          if (schema?.type === 'list') {
            // 列表整体替换
            const event = this.listOperator.diffArray(path, value)
            this.rebuildListChildren(path)
            await this.subscribeManager.emit({ path, event, batchId }, (p, v) =>
              this.scheduleUpdate(p, v)
            )

            // 收集事件，稍后统一触发
            allChangeEvents.push({ path, event, batchId })
          } else {
            // 普通字段：更新值
            const change = this.modelManager.setValue(path, value)
            const event: ValueEvent = {
              kind: 'value',
              prevValue: change.prevValue,
              nextValue: change.nextValue
            }
            await this.subscribeManager.emit({ path, event, batchId }, (p, v) =>
              this.scheduleUpdate(p, v)
            )

            // 收集事件，稍后统一触发
            allChangeEvents.push({ path, event, batchId })
          }
        }

        // 3. 重算控制属性（在触发 onValueChange 之前完成，确保 getRenderSchema 返回最新状态）
        this.renderNode = this.controlEngine.computeAll(this.renderNode)

        // 4. 统一触发所有 onValueChange 监听器（此时 renderNode 已经更新）
        for (const payload of allChangeEvents) {
          if (this.onValueChange) {
            this.onValueChange(payload)
          }
        }
        // while 循环自动检查是否有新更新
        // 如果 handler 中调用了 scheduleUpdate，下一次循环继续处理
      }

      // 所有更新处理完毕
      if (this.flushResolve) {
        this.flushResolve()
        this.flushPromise = null
        this.flushResolve = null
        this.flushReject = null
      }
    } catch (error: any) {
      // 错误处理
      if (this.flushReject) {
        this.flushReject(error)
        this.flushPromise = null
        this.flushResolve = null
        this.flushReject = null
      }
      throw error
    } finally {
      // 清理批次状态（确保即使发生错误也能清理）
      if (batchId) {
        this.subscribeManager.clearBatch(batchId)
      }

      // flush 完全结束，重置状态
      this.isFlushing = false
      this.flushDepth = 0 // 重置深度计数
    }
  }

  /**
   * 等待 flush 完成
   * @returns Promise
   */
  waitFlush(): Promise<void> {
    // 调整判断条件：检查 isFlushing 而非 flushDepth
    if (this.isFlushing || this.isScheduled) {
      // 如果已有等待的 promise，返回它
      if (this.flushPromise) {
        return this.flushPromise
      }

      // 创建新的 promise（支持 reject）
      this.flushPromise = new Promise((resolve, reject) => {
        this.flushResolve = resolve
        this.flushReject = reject
      })
      return this.flushPromise
    }

    // 没有待处理的更新，立即 resolve
    return Promise.resolve()
  }

  /**
   * 根据路径获取 SchemaNode
   */
  private getSchemaByPath(renderPath: string): any {
    const schemaPath = this.convertRenderPathToSchemaPath(renderPath)
    return this.parsedSchema.pathMap.get(schemaPath)
  }

  /**
   * 将 RenderNode 路径转换为 Schema 路径
   */
  private convertRenderPathToSchemaPath(renderPath: string): string {
    if (!renderPath) {
      return ''
    }

    const segments = renderPath.split('.')
    const schemaSegments = segments.map((segment) => {
      if (/^\d+$/.test(segment)) {
        return 'items'
      }
      return segment
    })

    return schemaSegments.join('.')
  }

  /**
   * 重建 list 的 children
   * @param listPath - 列表路径
   */
  private rebuildListChildren(listPath: string): void {
    // 找到 renderNode 中的 list 节点
    const listNode = this.findNodeByPath(this.renderNode, listPath)
    if (!listNode || listNode.type !== 'list') {
      return
    }

    // 获取 schema
    const schemaPath = this.convertRenderPathToSchemaPath(listPath)
    const schemaNode = this.parsedSchema.pathMap.get(schemaPath)
    if (!schemaNode || !schemaNode.items) {
      return
    }

    // 重新构建 list 的 children
    const listData = this.modelManager.getValue(listPath)
    const arrayLength = Array.isArray(listData) ? listData.length : 0

    const newChildren: RenderNode[][] = []
    for (let i = 0; i < arrayLength; i++) {
      const row = this.buildListRow(schemaNode.items, listPath, i)
      newChildren.push(row)
    }
    // 不可变更新：创建新的 list 节点并替换到根
    const newListNode: RenderNode = { ...listNode, children: newChildren }
    const newRoot = this.replaceNodeByPath(
      this.renderNode,
      listPath,
      newListNode
    )
    this.setRenderNode(newRoot)
  }

  /**
   * 构建 list 的单行（复用 RenderSchemaBuilder 的逻辑）
   */
  private buildListRow(
    itemsSchema: Record<string, any>,
    listPath: string,
    rowIndex: number
  ): RenderNode[] {
    const row: RenderNode[] = []

    for (const [prop, childSchema] of Object.entries(itemsSchema)) {
      const childPath = `${listPath}.${rowIndex}.${prop}`
      const childNode = this.buildNodeForListItem(childSchema, childPath)
      row.push(childNode)
    }

    return row
  }

  /**
   * 为 list item 构建节点（简化版，复制属性）
   */
  private buildNodeForListItem(
    schemaNode: any,
    currentPath: string
  ): RenderNode {
    const renderNode: RenderNode = {
      type: schemaNode.type,
      path: currentPath
    }

    if (schemaNode.prop) {
      renderNode.prop = schemaNode.prop
    }

    // 复制控制属性
    if (schemaNode.required !== undefined) {
      renderNode.required = schemaNode.required
    }
    if (schemaNode.disabled !== undefined) {
      renderNode.disabled = schemaNode.disabled
    }
    if (schemaNode.readonly !== undefined) {
      renderNode.readonly = schemaNode.readonly
    }
    if (schemaNode.ifShow !== undefined) {
      renderNode.ifShow = schemaNode.ifShow
    }
    if (schemaNode.show !== undefined) {
      renderNode.show = schemaNode.show
    }

    // 复制其他属性
    if (schemaNode.component !== undefined) {
      renderNode.component = schemaNode.component
    }
    if (schemaNode.componentProps !== undefined) {
      renderNode.componentProps = schemaNode.componentProps
    }
    if (schemaNode.formItemProps !== undefined) {
      renderNode.formItemProps = schemaNode.formItemProps
    }
    if (schemaNode.validators !== undefined) {
      renderNode.validators = schemaNode.validators
    }

    // 递归处理 properties（如果是 layout）
    if (schemaNode.properties) {
      const children: RenderNode[] = []

      // 确定子节点的路径前缀
      // layout 只是 UI 容器，不影响数据路径
      let childrenPathPrefix: string
      if (schemaNode.type === 'layout') {
        // 从 currentPath 中移除最后一段（即 layout 自己的 prop）
        const segments = currentPath.split('.').filter((s: string) => s)
        segments.pop()
        childrenPathPrefix = segments.join('.')
      } else {
        childrenPathPrefix = currentPath
      }

      for (const [prop, childSchema] of Object.entries(schemaNode.properties)) {
        const childPath = childrenPathPrefix
          ? `${childrenPathPrefix}.${prop}`
          : prop
        const childNode = this.buildNodeForListItem(childSchema, childPath)
        children.push(childNode)
      }
      renderNode.children = children
    }

    // 递归处理 items（如果是嵌套 list）
    if (schemaNode.items) {
      const listData = this.modelManager.getValue(currentPath)
      const arrayLength = Array.isArray(listData) ? listData.length : 0
      const children: RenderNode[][] = []
      for (let i = 0; i < arrayLength; i++) {
        const row = this.buildListRow(schemaNode.items, currentPath, i)
        children.push(row)
      }
      renderNode.children = children
    }

    this.copyCustomAttributes(schemaNode, renderNode)

    return renderNode
  }

  /**
   * 在渲染树中查找指定路径的节点
   */
  private findNodeByPath(
    node: RenderNode,
    targetPath: string
  ): RenderNode | null {
    if (node.path === targetPath) {
      return node
    }

    if (node.children) {
      if (node.type === 'list') {
        // list children 是二维数组
        for (const row of node.children as RenderNode[][]) {
          for (const child of row) {
            const found = this.findNodeByPath(child, targetPath)
            if (found) return found
          }
        }
      } else {
        // form/layout children 是一维数组
        for (const child of node.children as RenderNode[]) {
          const found = this.findNodeByPath(child, targetPath)
          if (found) return found
        }
      }
    }

    return null
  }

  /**
   * 不可变地替换指定路径的节点，返回新的根节点（结构共享）
   */
  private replaceNodeByPath(
    node: RenderNode,
    targetPath: string,
    nextNode: RenderNode
  ): RenderNode {
    // console.log('***replaceNodeByPath', node, targetPath, nextNode)
    // 命中目标，直接替换
    if (node.path === targetPath) {
      return nextNode
    }

    // 叶子节点或无 children，原样返回
    if (
      !node.children ||
      (Array.isArray(node.children) && node.children.length === 0)
    ) {
      return node
    }

    if (node.type === 'list') {
      // list 的 children 是二维数组：RenderNode[][]
      const rows = node.children as RenderNode[][]
      let changed = false
      const newRows: RenderNode[][] = []

      // 遍历每一行，递归替换子节点
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r]
        let rowChanged = false
        const newRow: RenderNode[] = [] // 每一行的新节点数组

        // 遍历每一列，递归替换子节点
        for (let c = 0; c < row.length; c++) {
          const child = row[c]
          const updatedChild = this.replaceNodeByPath(
            child,
            targetPath,
            nextNode
          )
          if (updatedChild !== child) {
            rowChanged = true
          }
          newRow.push(updatedChild)
        }

        if (rowChanged) {
          changed = true
          newRows.push(newRow)
        } else {
          // 结构共享：复用未变化的行引用
          newRows.push(row)
        }
      }

      if (changed) {
        return { ...node, children: newRows }
      }
      return node
    } else {
      // form/layout 的 children 是一维数组：RenderNode[]
      const children = node.children as RenderNode[]
      let changed = false
      const newChildren: RenderNode[] = []

      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const updatedChild = this.replaceNodeByPath(child, targetPath, nextNode)
        if (updatedChild !== child) {
          changed = true
        }
        newChildren.push(updatedChild)
      }

      if (changed) {
        return { ...node, children: newChildren }
      }
      return node
    }
  }

  /**
   * 获取渲染节点（供外部访问）
   */
  getRenderNode(): RenderNode {
    return this.renderNode
  }

  /**
   * 更新渲染节点（供外部设置）
   */
  setRenderNode(renderNode: RenderNode): void {
    this.renderNode = renderNode
  }

  /**
   * 复制自定义属性（排除已知属性）
   * @param source - 源对象
   * @param target - 目标对象
   */
  private copyCustomAttributes(source: any, target: any): void {
    const knownKeys = new Set([
      'type',
      'prop',
      'path',
      'required',
      'disabled',
      'readonly',
      'ifShow',
      'show',
      'subscribes',
      'validators',
      'properties',
      'items',
      'children',
      'component',
      'componentProps',
      'formItemProps',
      'formProps',
      'computed'
    ])

    for (const [key, value] of Object.entries(source)) {
      if (!knownKeys.has(key) && value !== undefined) {
        target[key] = value
      }
    }
  }
}

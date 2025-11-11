import {
  SubscribeDeclaration,
  SubscribeHandler,
  SubscribeHandlerContext,
  ValueEvent,
  StructureEvent
} from '../types'
import { ModelManager } from './ModelManager'
import { ParsedSchema } from './SchemaParser'
import { isRelativePath, isWildcardPath } from '../utils/path'
import { compilePattern, matchPath } from '../utils/match'
import type { CompiledPattern, PathMatchResult } from '../types'
import { generateId } from '../utils'

/**
 * 订阅处理项
 */
export interface HandlerItem {
  handler: SubscribeHandler
  options?: any
  source: {
    subscriberPath: string
    target: string
  }
}

/**
 * 相对路径订阅
 */
interface RelativeSubscribe {
  ownerPath: string // 定义者的 Schema 路径，如 'list.items.fieldA'
  relativePattern: string // 相对模式，如 '.fieldB'
  handlers: HandlerItem[]
}

/**
 * 订阅索引
 */
export interface SubscribeIndex {
  exact: Map<string, HandlerItem[]> // 精确路径
  pattern: Array<{
    // 通配符路径
    pattern: string
    compiled: CompiledPattern
    handlers: HandlerItem[]
  }>
  relative: Map<string, RelativeSubscribe[]> // 相对路径
}

/**
 * SubscribeManager 错误类
 */
export class SubscribeManagerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SubscribeManagerError'
  }
}

/**
 * 订阅管理器
 * 负责订阅索引构建、订阅匹配和事件派发
 */
export class SubscribeManager {
  private index: SubscribeIndex
  private modelManager: ModelManager
  private parsedSchema: ParsedSchema
  private debouncedHandlers: Map<string, Set<string>> // batchId → handlerKeys

  /**
   * 构造函数
   * @param subscribes - 订阅声明数组
   * @param modelManager - FormModel 管理器
   * @param parsedSchema - 解析后的 Schema
   */
  constructor(
    subscribes: SubscribeDeclaration[],
    modelManager: ModelManager,
    parsedSchema: ParsedSchema
  ) {
    this.modelManager = modelManager
    this.parsedSchema = parsedSchema
    this.debouncedHandlers = new Map()

    // 构建索引
    this.index = {
      exact: new Map(),
      pattern: [],
      relative: new Map()
    }

    this.buildIndex(subscribes)
  }

  /**
   * 构建订阅索引
   * @param subscribes - 订阅声明数组
   */
  buildIndex(subscribes: SubscribeDeclaration[]): void {
    for (const sub of subscribes) {
      const { target, handler, subscriberPath, options } = sub

      const item: HandlerItem = {
        handler,
        options,
        source: { subscriberPath, target }
      }

      // 1. 相对路径（以 . 开头）
      if (isRelativePath(target)) {
        if (!this.index.relative.has(target)) {
          this.index.relative.set(target, [])
        }
        this.index.relative.get(target)!.push({
          ownerPath: subscriberPath,
          relativePattern: target,
          handlers: [item]
        })
      }
      // 2. 通配符路径（包含 *）
      else if (isWildcardPath(target)) {
        const existing = this.index.pattern.find((p) => p.pattern === target)
        if (existing) {
          existing.handlers.push(item)
        } else {
          this.index.pattern.push({
            pattern: target,
            compiled: compilePattern(target),
            handlers: [item]
          })
        }
      }
      // 3. 精确路径
      else {
        if (!this.index.exact.has(target)) {
          this.index.exact.set(target, [])
        }
        this.index.exact.get(target)!.push(item)
      }
    }
  }

  /**
   * 查找匹配的订阅
   * @param eventPath - 事件路径（具体路径）
   * @returns 匹配的 handler 数组
   */
  findHandlers(eventPath: string): Array<{
    item: HandlerItem
    match?: PathMatchResult
    subscriberPath: string
  }> {
    const result: Array<{
      item: HandlerItem
      match?: PathMatchResult
      subscriberPath: string
    }> = []
    // 1. 精确匹配
    const exactHandlers = this.index.exact.get(eventPath)
    if (exactHandlers) {
      exactHandlers.forEach((item) => {
        // 精确匹配：订阅者路径可能需要实例化
        const subscriberPath = this.instantiateSubscriberPath(
          item.source.subscriberPath,
          eventPath
        )
        result.push({ item, subscriberPath })
      })
    }

    // 2. 通配符匹配,其中pattern是schema中的target路径
    for (const { pattern, handlers } of this.index.pattern) {
      const match = matchPath(pattern, eventPath)
      // console.log('match', match)
      if (match && match.matched) {
        handlers.forEach((item) => {
          // 通配符匹配：订阅者路径可能需要实例化, list.0.fieldA + list.item.fieldB -> list.0.fieldB是subscriberPath
          const subscriberPath = this.instantiateSubscriberPath(
            item.source.subscriberPath,
            eventPath
          )
          result.push({ item, match, subscriberPath })
        })
      }
    }

    // 3. 相对路径匹配
    const relativeHandlers = this.findRelativeHandlers(eventPath)
    relativeHandlers.forEach(({ item, subscriberPath }) => {
      result.push({ item, subscriberPath })
    })

    return result
  }

  /**
   * 查找相对路径订阅
   * @param eventPath - 事件路径
   * @returns 匹配的 handler 数组
   */
  private findRelativeHandlers(eventPath: string): Array<{
    item: HandlerItem
    subscriberPath: string
  }> {
    const handlers: Array<{ item: HandlerItem; subscriberPath: string }> = []

    // 解析事件路径的行信息
    const rowInfo = this.parseRowInfo(eventPath)
    if (!rowInfo) {
      return handlers
    }

    const { rowPath, relativePart } = rowInfo
    const relativePattern = `.${relativePart}`

    // 查找订阅该相对路径的节点
    const subscribes = this.index.relative.get(relativePattern)
    if (!subscribes) {
      return handlers
    }

    // 检查订阅者是否在同一行
    for (const sub of subscribes) {
      // 将订阅者的 Schema path 实例化为 Render path
      // 'list.items.fieldB' + 'list.0' → 'list.0.fieldB'
      const instancePath = this.instantiateOwnerPath(sub.ownerPath, rowPath)

      // 如果实例化成功，说明在同一行
      if (instancePath) {
        sub.handlers.forEach((item) => {
          handlers.push({ item, subscriberPath: instancePath })
        })
      }
    }

    return handlers
  }

  /**
   * 解析路径的行信息
   * @param path - 路径，如 'list.0.fieldA'
   * @returns 行信息或 null
   */
  private parseRowInfo(path: string): {
    rowPath: string
    relativePart: string
  } | null {
    const segments = path.split('.')

    // 从后往前找第一个数字
    for (let i = segments.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(segments[i])) {
        // 找到行索引
        const rowPath = segments.slice(0, i + 1).join('.')
        const relativePart = segments.slice(i + 1).join('.')

        if (relativePart) {
          return { rowPath, relativePart }
        }
        return null
      }
    }

    return null
  }

  /**
   * 将订阅者的 Schema path 实例化为 Render path
   * 根据事件路径推导订阅者应该在哪个位置
   * @param subscriberSchemaPath - 订阅者的 Schema 路径，如 'list.items.name2'
   * @param eventPath - 事件路径，如 'controlName' 或 'list.0.name'
   * @returns 实例化后的订阅者路径
   */
  private instantiateSubscriberPath(
    subscriberSchemaPath: string,
    eventPath: string
  ): string {
    // 如果订阅者路径不包含 'items'，说明不在 list 中，直接返回
    if (!subscriberSchemaPath.includes('items')) {
      return subscriberSchemaPath
    }

    // 订阅者在 list 中，需要根据事件路径推导行索引
    // 从事件路径中提取所有行索引
    const eventSegments = eventPath.split('.')
    const indices: string[] = []
    for (const seg of eventSegments) {
      if (/^\d+$/.test(seg)) {
        indices.push(seg)
      }
    }

    // 如果事件路径也在 list 中，使用相同的索引
    if (indices.length > 0) {
      // 将 subscriberSchemaPath 中的 'items' 按顺序替换为索引
      const subscriberSegments = subscriberSchemaPath.split('.')
      let indexCounter = 0
      const instanceSegments = subscriberSegments.map((seg) => {
        if (seg === 'items' && indexCounter < indices.length) {
          return indices[indexCounter++]
        }
        return seg
      })
      return instanceSegments.join('.')
    }

    // 事件路径不在 list 中（如 controlName），订阅者在 list 中
    // 这种情况下，一个事件会触发多个订阅者（每行一个）
    // 暂时返回 Schema 路径，由调用方处理
    return subscriberSchemaPath
  }

  /**
   * 将订阅者的 Schema path 实例化为 Render path
   * @param ownerPath - 订阅者的 Schema 路径，如 'list.items.fieldB' 或 'list.items.childList.items.fieldA'
   * @param rowPath - 行路径，如 'list.0' 或 'list.0.childList.1'
   * @returns 实例化后的路径，失败返回 null
   */
  private instantiateOwnerPath(
    ownerPath: string,
    rowPath: string
  ): string | null {
    const rowSegments = rowPath.split('.')

    // 提取 rowPath 中的所有索引
    const indices: string[] = []
    for (const seg of rowSegments) {
      if (/^\d+$/.test(seg)) {
        indices.push(seg)
      }
    }

    if (indices.length === 0) {
      return null
    }

    // 按顺序替换 ownerPath 中的所有 '.items.'
    // 例如：
    // ownerPath: 'items.items.tax' → 'items.1.tax'
    // ownerPath: 'list.items.childList.items.field' → 'list.0.childList.2.field'
    // ownerPath: 'items.items.items.items.field' → 'items.0.items.1.field'
    let instancePath = ownerPath
    for (const index of indices) {
      // 每次替换第一个遇到的 '.items.'
      instancePath = instancePath.replace(/\.items\./, `.${index}.`)
    }

    // 检查是否以 rowPath 开头
    if (instancePath.startsWith(rowPath + '.') || instancePath === rowPath) {
      return instancePath
    }

    return null
  }

  /**
   * 派发事件
   * @param payload - 事件负载
   * @param updateValueFn - updateValue 函数（由外部传入）
   */
  async emit(
    payload: {
      path: string
      event: ValueEvent | StructureEvent
      batchId: string
    },
    updateValueFn?: (path: string | Record<string, any>, value?: any) => void
  ): Promise<void> {
    const { path, event, batchId } = payload

    // 查找匹配的订阅
    const matchedHandlers = this.findHandlers(path)
    // console.log('matchedHandlers', matchedHandlers)

    if (matchedHandlers.length === 0) {
      return
    }

    // 执行所有 handler
    for (const { item, match, subscriberPath } of matchedHandlers) {
      // 检查防抖
      if (item.options?.debounce) {
        if (this.shouldSkipDebounce(item, batchId)) {
          continue
        }
      }

      // 检查订阅者路径是否需要展开（在 list 中）
      if (subscriberPath.includes('.items.')) {
        // 订阅者在 list 中，需要展开为所有行
        const expandedPaths = this.expandSubscriberPath(subscriberPath)
        console.log('expandedPaths', expandedPaths)
        // 为每行执行 handler
        for (const expandedPath of expandedPaths) {
          console.log('item.source.target', item.source.target)
          const ctx = this.buildSubscribeContext(
            path,
            item.source.target,
            expandedPath,
            event,
            batchId,
            match,
            updateValueFn
          )

          try {
            await item.handler(ctx)
          } catch (error) {
            console.error(
              `Subscribe handler error at path "${path}", target "${item.source.target}", subscriber "${expandedPath}":`,
              error
            )
          }
        }
      } else {
        // 订阅者不在 list 中，正常执行
        const ctx = this.buildSubscribeContext(
          path,
          item.source.target,
          subscriberPath,
          event,
          batchId,
          match,
          updateValueFn
        )

        try {
          await item.handler(ctx)
        } catch (error) {
          console.error(
            `Subscribe handler error at path "${path}", target "${item.source.target}":`,
            error
          )
        }
      }
    }
  }

  /**
   * 展开订阅者路径（将 Schema 路径转换为所有行的 Render 路径）
   * @param subscriberSchemaPath - 订阅者的 Schema 路径，如 'items.items.name2'
   * @returns 展开后的路径数组，如 ['items.0.name2', 'items.1.name2']
   */
  private expandSubscriberPath(subscriberSchemaPath: string): string[] {
    // 将 '.items.' 替换为 '.*.'
    // 'items.items.name2' → 'items.*.name2'
    const wildcardPath = subscriberSchemaPath.replace(/\.items\./g, '.*.')

    // 使用 modelManager.expandWildcard 展开
    const expandedPaths = this.modelManager.expandWildcard(wildcardPath)

    // 如果展开为空（list 不存在或为空数组），返回空数组
    return expandedPaths
  }

  /**
   * 检查是否应该跳过防抖的 handler
   * @param item - Handler 项
   * @param batchId - 批次 ID
   * @returns 是否跳过
   */
  private shouldSkipDebounce(item: HandlerItem, batchId: string): boolean {
    // 获取该批次已执行的 handlers
    if (!this.debouncedHandlers.has(batchId)) {
      this.debouncedHandlers.set(batchId, new Set())
    }

    const executed = this.debouncedHandlers.get(batchId)!

    // 生成 handler 的唯一标识
    const handlerKey = `${item.source.subscriberPath}:${item.source.target}`

    // 如果已执行，跳过
    if (executed.has(handlerKey)) {
      return true
    }

    // 标记为已执行
    executed.add(handlerKey)
    return false
  }

  /**
   * 清理批次的防抖记录
   * @param batchId - 批次 ID
   */
  clearBatch(batchId: string): void {
    this.debouncedHandlers.delete(batchId)
  }

  /**
   * 构建订阅处理函数的上下文
   */
  private buildSubscribeContext(
    path: string,
    target: string,
    subscriberPath: string,
    event: ValueEvent | StructureEvent,
    batchId: string,
    match?: PathMatchResult,
    updateValueFn?: (path: string | Record<string, any>, value?: any) => void
  ): SubscribeHandlerContext {
    /*
      比如：list.items.fieldB订阅了.fieldA，那么（当updateValue('list.1.fieldA', 25)时）：
      path: 'list.1.fieldA',
      target: '.fieldA',
      subscriberPath: 'list.1.fieldB',
      event: { kind: 'value', prevValue: 18, nextValue: 25 },
      match: { pattern: 'list.*.fieldA', stars: ['1'] },
      batchId: 'batch_123'
    */
    return {
      path, // 触发这个事件的具体路径，如 'list.0.fieldB'
      target, // schema中subscribe的源路径，如 'list.*.fieldA'、'.fieldB'
      subscriberPath, // 订阅者的具体路径，如 'list.0.fieldA'、'list.0.fieldB'
      event, // 事件，如 { kind: 'value', prevValue: 18, nextValue: 25 }
      match: match
        ? {
            pattern: target,
            stars: match.stars || []
          }
        : undefined,
      batchId,

      getSchema: (p?: string) => {
        const targetPath = p || path
        return this.getSchemaByPath(targetPath)
      },

      getValue: (p?: string) => {
        const targetPath = p || path
        return this.modelManager.getValue(targetPath)
      },

      getCurRowValue: () => {
        const rowPath = this.getNearestRowPath(subscriberPath)
        if (!rowPath) {
          return undefined
        }
        return this.modelManager.getValue(rowPath)
      },

      getCurRowIndex: () => {
        return this.getNearestRowIndex(subscriberPath)
      },

      updateValue: (pathOrObj: string | Record<string, any>, value?: any) => {
        if (!updateValueFn) {
          throw new SubscribeManagerError(
            'updateValue is not available in subscribe context'
          )
        }
        updateValueFn(pathOrObj, value)
      },

      updateSelf: (value: any) => {
        if (!updateValueFn) {
          throw new SubscribeManagerError(
            'updateSelf is not available in subscribe context'
          )
        }
        updateValueFn(subscriberPath, value)
      }
    }
  }

  /**
   * 获取最近一层 list 的行路径
   */
  private getNearestRowPath(path: string): string {
    if (!path) {
      return ''
    }

    const segments = path.split('.')

    for (let i = segments.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(segments[i])) {
        return segments.slice(0, i + 1).join('.')
      }
    }

    return ''
  }

  /**
   * 获取最近一层 list 的行索引
   */
  private getNearestRowIndex(path: string): number {
    if (!path) {
      return -1
    }

    const segments = path.split('.')

    for (let i = segments.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(segments[i])) {
        return parseInt(segments[i], 10)
      }
    }

    return -1
  }

  /**
   * 根据路径获取 SchemaNode
   * @param renderPath - RenderNode 的路径（包含数组索引）
   * @returns SchemaNode 或 undefined
   */
  private getSchemaByPath(renderPath: string): any {
    // 将 RenderNode path 转换为 Schema path
    const schemaPath = this.convertRenderPathToSchemaPath(renderPath)

    // 从 parsedSchema.pathMap 获取
    return this.parsedSchema.pathMap.get(schemaPath)
  }

  /**
   * 将 RenderNode 路径转换为 Schema 路径
   * @param renderPath - RenderNode 路径
   * @returns Schema 路径
   */
  private convertRenderPathToSchemaPath(renderPath: string): string {
    if (!renderPath) {
      return ''
    }

    // 将数字索引替换为 'items'
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
   * 生成批次 ID
   * @returns 批次 ID
   */
  generateBatchId(): string {
    return generateId()
  }

  /**
   * 获取订阅索引（用于调试）
   * @returns 订阅索引
   */
  getIndex(): SubscribeIndex {
    return this.index
  }
}

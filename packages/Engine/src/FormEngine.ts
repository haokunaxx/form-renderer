import {
  FormEngineOptions,
  RenderNode,
  ValidationResult,
  OnValueChangeOptions,
  ResetOptions,
  ValueEvent,
  StructureEvent,
  SchemaNode,
  InitContext
} from './types'
import { SchemaParser, ParsedSchema } from './core/SchemaParser'
import { ModelManager } from './core/ModelManager'
import { RenderSchemaBuilder } from './core/RenderSchemaBuilder'
import { ControlEngine } from './core/ControlEngine'
import { SubscribeManager } from './core/SubscribeManager'
import { ListOperator } from './core/ListOperator'
import { UpdateScheduler } from './core/UpdateScheduler'
import { Validator } from './core/Validator'
import { deepClone, getByPath } from './utils'
import { matchPath } from './utils/match'

/**
 * FormEngine 错误类
 */
export class FormEngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FormEngineError'
  }
}

/**
 * FormEngine - 表单引擎主类
 */
export class FormEngine {
  private schemaParser: SchemaParser
  private modelManager: ModelManager
  private renderSchemaBuilder: RenderSchemaBuilder
  private controlEngine: ControlEngine
  private subscribeManager: SubscribeManager
  private listOperator: ListOperator
  private updateScheduler: UpdateScheduler
  private validator: Validator

  private parsedSchema: ParsedSchema
  private renderNode: RenderNode
  private initialModel: any
  private initialSchema: any

  private destroyed: boolean = false
  private onValueChangeListeners: Array<{
    handler: (payload: any) => void
    options?: OnValueChangeOptions
  }> = []

  /**
   * 构造函数
   * @param options - 初始化选项
   */
  constructor(options: FormEngineOptions) {
    const { schema, model, maxUpdateDepth = 10 } = options
    this.initialSchema = schema

    // 1. 解析 Schema
    this.schemaParser = new SchemaParser()
    this.parsedSchema = this.schemaParser.parse(schema)

    // 2. 根据是否传入 model 决定使用哪个值
    let initialModel: any
    if (model !== undefined) {
      // 编辑模式：直接使用传入的 model
      initialModel = model
    } else {
      // 新建模式：从 schema 计算默认值
      initialModel = this.computeDefaultModel(this.parsedSchema.root)
    }

    // 保存初始 model
    this.initialModel = deepClone(initialModel)

    // 3. 创建 ModelManager
    this.modelManager = new ModelManager(initialModel)

    // 3. 创建 RenderSchemaBuilder
    this.renderSchemaBuilder = new RenderSchemaBuilder(this.modelManager)
    this.renderNode = this.renderSchemaBuilder.build(this.parsedSchema.root)

    // 4. 创建 ControlEngine
    this.controlEngine = new ControlEngine(this.modelManager, this.parsedSchema)

    // 5. 初始化计算控制属性（必须在创建 UpdateScheduler 之前完成）
    // 确保 UpdateScheduler 接收的 renderNode 已经计算了 computed
    this.renderNode = this.controlEngine.computeAll(this.renderNode)

    // 6. 创建 SubscribeManager
    this.subscribeManager = new SubscribeManager(
      this.parsedSchema.subscribes,
      this.modelManager,
      this.parsedSchema
    )

    // 7. 创建 ListOperator
    this.listOperator = new ListOperator(this.modelManager)

    // 8. 创建 UpdateScheduler（此时 renderNode 已经计算了 computed）
    this.updateScheduler = new UpdateScheduler(
      this.modelManager,
      this.controlEngine,
      this.subscribeManager,
      this.listOperator,
      this.renderSchemaBuilder,
      this.parsedSchema,
      this.renderNode,
      {
        maxDepth: maxUpdateDepth,
        onValueChange: (payload) => this.notifyValueChange(payload)
      }
    )

    // 9. 创建 Validator
    this.validator = new Validator(
      this.modelManager,
      this.updateScheduler,
      this.parsedSchema
    )
  }

  /**
   * 获取 Schema
   * @param path - 路径，不传则返回整个 Schema
   * @returns Schema 节点
   */
  getSchema(path?: string): any {
    if (!path || path === '') {
      return this.parsedSchema.root
    }

    // 将 RenderNode path 转换为 Schema path
    const schemaPath = this.convertRenderPathToSchemaPath(path)
    return this.parsedSchema.pathMap.get(schemaPath)
  }

  /**
   * 获取值
   * @param path - 路径，不传则返回整个 model
   * @returns 值
   */
  getValue(path?: string): any {
    this.checkDestroyed()
    return this.modelManager.getValue(path)
  }

  /**
   * 获取渲染 Schema
   * @returns 渲染 Schema 根节点
   */
  getRenderSchema(): RenderNode {
    this.checkDestroyed()
    // 返回由 UpdateScheduler 维护的最新渲染树根节点，确保结构变化后引用更新
    return this.updateScheduler.getRenderNode()
  }

  /**
   * 更新值
   * @param path - 路径或对象
   * @param value - 值
   */
  updateValue(path: string | Record<string, any>, value?: any): void {
    this.checkDestroyed()
    this.updateScheduler.scheduleUpdate(path, value)
  }

  /**
   * 追加行到列表末尾
   * @param listPath - 列表路径
   * @param row - 新行数据
   */
  listAppend(listPath: string, row: any): void {
    this.checkDestroyed()
    const event = this.listOperator.append(listPath, row)
    this.updateScheduler.scheduleListOperation(listPath, event)
  }

  /**
   * 在指定位置插入行
   * @param listPath - 列表路径
   * @param index - 插入位置
   * @param row - 新行数据
   */
  listInsert(listPath: string, index: number, row: any): void {
    this.checkDestroyed()
    const event = this.listOperator.insert(listPath, index, row)
    this.updateScheduler.scheduleListOperation(listPath, event)
  }

  /**
   * 删除指定行
   * @param listPath - 列表路径
   * @param index - 行索引
   */
  listRemove(listPath: string, index: number): void {
    this.checkDestroyed()
    const event = this.listOperator.remove(listPath, index)
    this.updateScheduler.scheduleListOperation(listPath, event)
  }

  /**
   * 移动行
   * @param listPath - 列表路径
   * @param from - 源索引
   * @param to - 目标索引
   */
  listMove(listPath: string, from: number, to: number): void {
    this.checkDestroyed()
    const event = this.listOperator.move(listPath, from, to)
    this.updateScheduler.scheduleListOperation(listPath, event)
  }

  /**
   * 交换两行
   * @param listPath - 列表路径
   * @param a - 第一个索引
   * @param b - 第二个索引
   */
  listSwap(listPath: string, a: number, b: number): void {
    this.checkDestroyed()
    const event = this.listOperator.swap(listPath, a, b)
    this.updateScheduler.scheduleListOperation(listPath, event)
  }

  /**
   * 替换指定行
   * @param listPath - 列表路径
   * @param index - 行索引
   * @param row - 新行数据
   */
  listReplace(listPath: string, index: number, row: any): void {
    this.checkDestroyed()
    const event = this.listOperator.replace(listPath, index, row)
    this.updateScheduler.scheduleListOperation(listPath, event)
  }

  /**
   * 清空列表
   * @param listPath - 列表路径
   */
  listClear(listPath: string): void {
    this.checkDestroyed()
    const event = this.listOperator.clear(listPath)
    this.updateScheduler.scheduleListOperation(listPath, event)
  }

  /**
   * 校验表单
   * @param paths - 可选的路径或路径数组
   * @returns 校验结果
   */
  async validate(paths?: string | string[]): Promise<ValidationResult> {
    this.checkDestroyed()
    // 使用最新的渲染树进行校验，避免因结构变化导致的旧引用
    return this.validator.validate(this.updateScheduler.getRenderNode(), paths)
  }

  /**
   * 重置表单
   * @param target - 重置目标
   *   - 不传：重置到初始状态（initialModel）
   *   - 'default'：重置到 schema 的 defaultValue
   *   - 具体对象：重置到指定值，并更新 initialModel
   * @param options - 重置选项
   */
  reset(target?: any | 'default', _options?: ResetOptions): void {
    this.checkDestroyed()

    let targetModel: any

    if (target === 'default') {
      // 重置到 schema 的 defaultValue
      targetModel = this.computeDefaultModel(this.parsedSchema.root)
    } else if (target !== undefined) {
      // 重置到指定值
      targetModel = target
      this.initialModel = deepClone(target)
    } else {
      // 重置到初始状态
      targetModel = this.initialModel //非编辑模式等同于默认值
    }

    this.modelManager.reset(targetModel)
    this.setFormSchema(this.initialSchema)
  }

  /**
   * 监听值变化
   * @param handler - 处理函数
   * @param options - 选项
   * @returns 取消订阅函数
   */
  onValueChange(
    handler: (payload: {
      path: string
      event: ValueEvent | StructureEvent
      batchId: string
    }) => void,
    options?: OnValueChangeOptions
  ): () => void {
    this.checkDestroyed()

    const listener = { handler, options }
    this.onValueChangeListeners.push(listener)

    // 返回取消订阅函数
    return () => {
      const index = this.onValueChangeListeners.indexOf(listener)
      if (index > -1) {
        this.onValueChangeListeners.splice(index, 1)
      }
    }
  }

  /**
   * 更新 Schema
   * @param schema - 新的 JSON Schema
   */
  setFormSchema(schema: any): void {
    this.checkDestroyed()

    // 1. 解析新 schema
    this.parsedSchema = this.schemaParser.parse(schema)

    // 2. 重建渲染树
    this.renderNode = this.renderSchemaBuilder.build(this.parsedSchema.root)

    // 3. 重建 SubscribeManager
    this.subscribeManager = new SubscribeManager(
      this.parsedSchema.subscribes,
      this.modelManager,
      this.parsedSchema
    )

    // 4. 重建 ControlEngine
    this.controlEngine = new ControlEngine(this.modelManager, this.parsedSchema)

    // 5. 重建 Validator
    this.validator = new Validator(
      this.modelManager,
      this.updateScheduler,
      this.parsedSchema
    )

    // 6. 重新计算控制属性（必须在创建 UpdateScheduler 之前）
    this.renderNode = this.controlEngine.computeAll(this.renderNode)

    // 7. 更新 UpdateScheduler 的依赖
    this.updateScheduler = new UpdateScheduler(
      this.modelManager,
      this.controlEngine,
      this.subscribeManager,
      this.listOperator,
      this.renderSchemaBuilder,
      this.parsedSchema,
      this.renderNode,
      {
        maxDepth: this.updateScheduler['maxDepth'], // 保留原来的配置
        onValueChange: (payload) => this.notifyValueChange(payload)
      }
    )
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    if (this.destroyed) {
      return
    }

    // 清理监听器
    this.onValueChangeListeners = []

    // 标记为已销毁
    this.destroyed = true
  }

  /**
   * 等待更新完成
   * @returns Promise
   */
  waitFlush(): Promise<void> {
    return this.updateScheduler.waitFlush()
  }

  /**
   * 检查是否已销毁
   */
  private checkDestroyed(): void {
    if (this.destroyed) {
      throw new FormEngineError('FormEngine has been destroyed')
    }
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
   * 从 schema 计算默认 model
   * @param schemaNode - Schema 节点
   * @returns 默认 model
   */
  private computeDefaultModel(schemaNode: SchemaNode): any {
    const model: any = {}

    if (!schemaNode.properties) {
      return model
    }

    // 创建 init 上下文
    const createContext = (currentModel: any): InitContext => ({
      mode: 'init',
      getValue: (path?: string) => {
        if (!path) return currentModel
        return getByPath(currentModel, path)
      }
    })

    for (const [prop, childSchema] of Object.entries(schemaNode.properties)) {
      if (childSchema.type === 'field') {
        // 字段：使用 defaultValue 或推断默认值
        if (childSchema.defaultValue !== undefined) {
          if (typeof childSchema.defaultValue === 'function') {
            const ctx = createContext(model)
            model[prop] = childSchema.defaultValue(ctx)
          } else {
            model[prop] = childSchema.defaultValue
          }
        } else {
          // 没有 defaultValue，根据组件类型推断
          model[prop] = this.inferDefaultValue(childSchema)
        }
      } else if (childSchema.type === 'layout') {
        // layout：递归处理（不影响数据路径）
        const layoutDefaults = this.computeDefaultModel(childSchema)
        Object.assign(model, layoutDefaults)
      } else if (childSchema.type === 'list') {
        // list：使用 defaultValue 或空数组
        if (childSchema.defaultValue !== undefined) {
          if (typeof childSchema.defaultValue === 'function') {
            const ctx = createContext(model)
            model[prop] = childSchema.defaultValue(ctx)
          } else {
            model[prop] = childSchema.defaultValue
          }
        } else {
          // 没有 defaultValue，使用空数组
          model[prop] = []
        }
      }
    }

    return model
  }

  /**
   * 根据组件类型推断默认值
   */
  private inferDefaultValue(schemaNode: SchemaNode): any {
    const component = schemaNode.component

    // 根据常见组件推断
    switch (component) {
      case 'input':
      case 'textarea':
        return ''
      case 'number':
      case 'slider':
        return 0
      case 'switch':
        return false
      case 'select':
      case 'radio':
      case 'checkbox':
        return undefined
      case 'datepicker':
      case 'timepicker':
        return null
      default:
        return undefined
    }
  }

  /**
   * 通知 onValueChange 监听器
   */
  private notifyValueChange(payload: {
    path: string
    event: ValueEvent | StructureEvent
    batchId: string
  }): void {
    for (const listener of this.onValueChangeListeners) {
      const { handler, options } = listener

      // 应用过滤器：路径模式匹配
      if (options?.pattern) {
        const result = matchPath(options.pattern, payload.path)
        if (!result.matched) {
          continue
        }
      }

      // 应用过滤器：事件类型
      if (options?.kinds && options.kinds.length > 0) {
        if (!options.kinds.includes(payload.event.kind)) {
          continue
        }
      }

      // 触发处理函数（捕获错误，避免影响其他监听器）
      try {
        handler(payload)
      } catch (error) {
        console.error('Error in onValueChange handler:', error)
      }
    }
  }
}

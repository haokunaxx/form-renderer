import { shallowRef, readonly } from 'vue'
import type { ShallowRef, DeepReadonly } from 'vue'
import {
  FormEngine,
  type RenderNode,
  type JsonSchemaNode
} from '@form-renderer/engine'
import { UpdateScheduler } from './UpdateScheduler'

// 类型别名
type FormSchema = JsonSchemaNode
type FormModel = Record<string, any>
type RenderSchema = RenderNode

interface ValueChangeEvent {
  path: string
  event: {
    kind: 'value' | 'structure'
    prevValue?: any
    nextValue?: any
    [key: string]: any
  }
  batchId: string
}

/**
 * 响应式引擎选项
 */
export interface ReactiveEngineOptions {
  schema: FormSchema
  model?: FormModel
  enableUpdateScheduler?: boolean
}

/**
 * 响应式引擎
 * 将 FormEngine 与 Vue3 响应式系统集成
 */
export class ReactiveEngine {
  private engine: FormEngine
  private renderSchemaRef: ShallowRef<RenderSchema>
  private modelRef: ShallowRef<FormModel>
  private subscriptions: (() => void)[] = []
  private isDestroyed = false
  private updateScheduler?: UpdateScheduler

  constructor(options: ReactiveEngineOptions) {
    const { schema, model, enableUpdateScheduler = false } = options
    // 创建 FormEngine 实例
    this.engine = new FormEngine({ schema, model })
    // 初始化响应式引用
    this.renderSchemaRef = shallowRef(this.engine.getRenderSchema())
    this.modelRef = shallowRef(this.engine.getValue())
    console.log(this.renderSchemaRef)
    // 创建更新调度器（可选）
    if (enableUpdateScheduler) {
      this.updateScheduler = new UpdateScheduler(this.engine)
    }

    // 建立响应式连接
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听值变化事件
    const unsubscribe = this.engine.onValueChange((event: ValueChangeEvent) => {
      if (this.isDestroyed) return

      if (event.event.kind === 'value') {
        // 值变化：精准更新
        this.handleValueChange(event)
      } else if (event.event.kind === 'structure') {
        // 结构变化：重新获取 renderSchema
        this.handleStructureChange()
      }
    })

    this.subscriptions.push(unsubscribe)
  }

  /**
   * 处理值变化
   * 🔥 简化：Engine 已采用不可变更新，直接获取新引用即可
   */
  private handleValueChange(_event: ValueChangeEvent): void {
    // Engine 的 model 已经是新引用，直接赋值
    // shallowRef 会自动检测到引用变化
    this.modelRef.value = this.engine.getValue()

    // 同时更新 renderSchema（控制属性可能受影响）
    this.renderSchemaRef.value = this.engine.getRenderSchema()
  }

  /**
   * 处理结构变化
   * 🔥 简化：Engine 已采用不可变更新，直接获取新引用即可
   */
  private handleStructureChange(): void {
    // Engine 的 renderNode 和 model 都已经是新引用
    // shallowRef 会自动检测到变化
    this.renderSchemaRef.value = this.engine.getRenderSchema()
    this.modelRef.value = this.engine.getValue()
  }

  /**
   * 获取响应式的渲染 Schema（只读）
   */
  getRenderSchema(): DeepReadonly<ShallowRef<RenderSchema>> {
    return readonly(this.renderSchemaRef)
  }

  /**
   * 获取响应式的数据模型（只读）
   */
  getModel(): DeepReadonly<ShallowRef<FormModel>> {
    return readonly(this.modelRef)
  }

  /**
   * 获取原始 FormEngine 实例
   */
  getEngine(): FormEngine {
    return this.engine
  }

  /**
   * 更新值
   */
  updateValue(path: string, value: any): void
  updateValue(updates: Record<string, any>): void
  updateValue(pathOrUpdates: string | Record<string, any>, value?: any): void {
    if (this.isDestroyed) {
      console.warn('Cannot update value on destroyed ReactiveEngine')
      return
    }

    if (this.updateScheduler) {
      // 使用调度器批量更新
      if (typeof pathOrUpdates === 'string') {
        this.updateScheduler.scheduleUpdate(pathOrUpdates, value)
      } else {
        this.updateScheduler.scheduleBatch(pathOrUpdates)
      }
    } else {
      // 直接更新
      if (typeof pathOrUpdates === 'string') {
        this.engine.updateValue(pathOrUpdates, value)
      } else {
        this.engine.updateValue(pathOrUpdates)
      }
    }
  }

  /**
   * 立即刷新所有待处理的更新（仅在启用调度器时有效）
   */
  flush(): void {
    if (this.updateScheduler) {
      this.updateScheduler.flush()
    }
  }

  /**
   * 等待刷新所有待处理的更新（仅在启用调度器时有效）
   */
  waitFlush(): Promise<void> {
    if (this.engine) {
      return this.engine.waitFlush()
    }
    return Promise.resolve()
  }

  /**
   * 设置表单 Schema
   */
  setFormSchema(schema: FormSchema): void {
    if (this.isDestroyed) {
      console.warn('Cannot set schema on destroyed ReactiveEngine')
      return
    }

    this.engine.setFormSchema(schema)

    // 更新响应式数据
    this.renderSchemaRef.value = this.engine.getRenderSchema()
    this.modelRef.value = this.engine.getValue()
  }

  /**
   * 重置表单
   * @param target - 重置目标
   *   - 不传：重置到初始状态（initialModel）
   *   - 'default'：重置到 schema 的 defaultValue
   *   - 具体对象：重置到指定值
   */
  reset(target?: any | 'default'): void {
    if (this.isDestroyed) {
      console.warn('Cannot reset destroyed ReactiveEngine')
      return
    }
    this.engine.reset(target)
    // 更新响应式数据
    this.modelRef.value = this.engine.getValue()
    this.renderSchemaRef.value = this.engine.getRenderSchema()
  }

  /**
   * 校验表单
   */
  async validate(paths?: string[]) {
    if (this.isDestroyed) {
      console.warn('Cannot validate destroyed ReactiveEngine')
      return { valid: false, errors: {} }
    }

    return this.engine.validate(paths)
  }

  /**
   * 获取列表操作器
   * 返回一个包装了 FormEngine list 方法的对象
   */
  getListOperator(path: string) {
    if (this.isDestroyed) {
      throw new Error('Cannot get list operator from destroyed ReactiveEngine')
    }
    // 返回一个包装对象，将方法委托给 FormEngine
    return {
      append: (row: any) => {
        this.engine.listAppend(path, row)
      },
      insert: (index: number, row: any) =>
        this.engine.listInsert(path, index, row),
      remove: (index: number) => this.engine.listRemove(path, index),
      move: (from: number, to: number) => this.engine.listMove(path, from, to),
      swap: (a: number, b: number) => this.engine.listSwap(path, a, b),
      replace: (index: number, row: any) =>
        this.engine.listReplace(path, index, row),
      clear: () => this.engine.listClear(path)
    }
  }

  /**
   * 销毁引擎，清理所有订阅
   */
  destroy(): void {
    if (this.isDestroyed) return

    this.isDestroyed = true

    // 清理所有订阅
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []

    // 销毁更新调度器
    if (this.updateScheduler) {
      this.updateScheduler.destroy()
      this.updateScheduler = undefined
    }
  }

  /**
   * 检查引擎是否已销毁
   */
  get destroyed(): boolean {
    return this.isDestroyed
  }
}

/**
 * 创建响应式引擎实例
 */
export function createReactiveEngine(
  options: ReactiveEngineOptions
): ReactiveEngine {
  return new ReactiveEngine(options)
}

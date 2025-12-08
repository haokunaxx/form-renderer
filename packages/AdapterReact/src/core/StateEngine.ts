import {
  FormEngine,
  type RenderNode,
  type JsonSchemaNode,
  type ValidationResult
} from '@form-renderer/engine'

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
  phase?: 'immediate' | 'computed'
}

/**
 * 状态快照
 */
export interface StateSnapshot {
  renderSchema: RenderSchema
  model: FormModel
}

/**
 * 状态引擎选项
 */
export interface StateEngineOptions {
  schema: FormSchema
  model?: FormModel
}

/**
 * 监听器类型
 */
export type Listener = () => void

/**
 * StateEngine - React 版本的状态引擎
 * 将 FormEngine 与 React 集成，提供 useSyncExternalStore 所需的订阅/通知机制
 */
export class StateEngine {
  private engine: FormEngine
  private listeners: Set<Listener> = new Set()
  private isDestroyed = false
  private currentSnapshot: StateSnapshot

  constructor(options: StateEngineOptions) {
    const { schema, model } = options

    // 创建 FormEngine 实例
    this.engine = new FormEngine({ schema, model })

    // 初始化快照
    this.currentSnapshot = {
      renderSchema: this.engine.getRenderSchema(),
      model: this.engine.getValue()
    }

    // 建立事件监听
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听值变化事件
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

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener()
      } catch (error) {
        console.error('Error in state listener:', error)
      }
    })
  }

  /**
   * 订阅状态变化（用于 useSyncExternalStore）
   * @param listener - 监听器函数
   * @returns 取消订阅函数
   */
  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 获取当前快照（用于 useSyncExternalStore）
   * @returns 不可变的状态快照
   */
  getSnapshot = (): StateSnapshot => {
    return this.currentSnapshot
  }

  /**
   * 获取渲染 Schema
   */
  getRenderSchema(): RenderSchema {
    return this.currentSnapshot.renderSchema
  }

  /**
   * 获取数据模型
   */
  getModel(): FormModel {
    return this.currentSnapshot.model
  }

  /**
   * 获取原始 FormEngine 实例
   */
  getEngine(): FormEngine {
    return this.engine
  }

  /**
   * 获取指定路径的值
   * @param path - 路径，不传则返回整个 model
   */
  getValue(path?: string): any {
    if (!path) {
      return this.engine.getValue()
    }
    return this.engine.getValue(path)
  }

  /**
   * 更新值
   */
  updateValue(path: string, value: any): void
  updateValue(updates: Record<string, any>): void
  updateValue(pathOrUpdates: string | Record<string, any>, value?: any): void {
    if (this.isDestroyed) {
      console.warn('Cannot update value on destroyed StateEngine')
      return
    }

    if (typeof pathOrUpdates === 'string') {
      this.engine.updateValue(pathOrUpdates, value)
    } else {
      this.engine.updateValue(pathOrUpdates)
    }
  }

  /**
   * 等待刷新所有待处理的更新
   */
  waitFlush(): Promise<void> {
    return this.engine.waitFlush()
  }

  /**
   * 设置表单 Schema
   */
  setFormSchema(schema: FormSchema): void {
    if (this.isDestroyed) {
      console.warn('Cannot set schema on destroyed StateEngine')
      return
    }

    this.engine.setFormSchema(schema)

    // 更新快照
    this.currentSnapshot = {
      renderSchema: this.engine.getRenderSchema(),
      model: this.engine.getValue()
    }

    // 通知订阅者
    this.notifyListeners()
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
      console.warn('Cannot reset destroyed StateEngine')
      return
    }

    this.engine.reset(target)

    // 更新快照
    this.currentSnapshot = {
      renderSchema: this.engine.getRenderSchema(),
      model: this.engine.getValue()
    }

    // 通知订阅者
    this.notifyListeners()
  }

  /**
   * 校验表单
   */
  async validate(paths?: string[]): Promise<ValidationResult> {
    if (this.isDestroyed) {
      console.warn('Cannot validate destroyed StateEngine')
      return {
        ok: false,
        errors: [{ path: '', message: 'Engine is destroyed' }],
        errorByPath: {}
      }
    }

    return this.engine.validate(paths)
  }

  /**
   * 获取列表操作器
   */
  getListOperator(path: string) {
    if (this.isDestroyed) {
      throw new Error('Cannot get list operator from destroyed StateEngine')
    }

    // 返回包装对象，将方法委托给 FormEngine
    return {
      append: (row: any) => {
        this.engine.listAppend(path, row)
      },
      insert: (index: number, row: any) => {
        this.engine.listInsert(path, index, row)
      },
      remove: (index: number) => {
        this.engine.listRemove(path, index)
      },
      move: (from: number, to: number) => {
        this.engine.listMove(path, from, to)
      },
      swap: (a: number, b: number) => {
        this.engine.listSwap(path, a, b)
      },
      replace: (index: number, row: any) => {
        this.engine.listReplace(path, index, row)
      },
      clear: () => {
        this.engine.listClear(path)
      }
    }
  }

  /**
   * 销毁引擎，清理所有订阅
   */
  destroy(): void {
    if (this.isDestroyed) return

    this.isDestroyed = true

    // 清理所有订阅
    this.listeners.clear()
  }

  /**
   * 检查引擎是否已销毁
   */
  get destroyed(): boolean {
    return this.isDestroyed
  }
}

/**
 * 创建状态引擎实例
 */
export function createStateEngine(options: StateEngineOptions): StateEngine {
  return new StateEngine(options)
}

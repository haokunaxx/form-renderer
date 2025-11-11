import type { ReactiveEngine } from './ReactiveEngine'
import type { ComponentRegistry } from './ComponentRegistry'
import { BatchUpdateManager } from '../utils/batch'

/**
 * 事件处理器配置选项
 */
export interface EventHandlerOptions {
  /**
   * 是否启用批量更新
   * @default false
   */
  enableBatch?: boolean

  /**
   * 批量更新延迟（毫秒）
   * @default 16
   */
  batchDelay?: number

  /**
   * 值转换错误处理
   */
  onTransformError?: (error: Error, path: string, value: any) => void

  /**
   * 更新错误处理
   */
  onUpdateError?: (error: Error, path: string, value: any) => void
}

/**
 * 事件处理器
 * 负责处理所有用户交互事件，协调 ReactiveEngine 和 ComponentRegistry
 */
export class EventHandler {
  private engine: ReactiveEngine
  private registry: ComponentRegistry
  private batchManager?: BatchUpdateManager
  private options: EventHandlerOptions

  constructor(
    engine: ReactiveEngine,
    registry: ComponentRegistry,
    options: EventHandlerOptions = {}
  ) {
    this.engine = engine
    this.registry = registry
    this.options = {
      enableBatch: false,
      batchDelay: 16,
      ...options
    }

    // 如果启用批量更新，创建 BatchUpdateManager
    if (this.options.enableBatch) {
      this.batchManager = new BatchUpdateManager((updates) => {
        // 将 UpdateItem[] 转换为 Record<string, any>
        const updateObj = updates.reduce(
          (acc, item) => {
            acc[item.path] = item.value
            return acc
          },
          {} as Record<string, any>
        )
        this.engine.updateValue(updateObj)
      })
    }
  }

  /**
   * 处理字段值变化
   */
  handleFieldChange(path: string, value: any, componentName: string): void {
    try {
      // 获取组件定义
      const definition = this.registry.get(componentName)

      if (!definition) {
        console.warn(`Component "${componentName}" not found in registry`)
        return
      }

      // 应用值转换器
      const engineValue = this.transformValue(value, definition)

      // 更新引擎
      this.updateEngine(path, engineValue)
    } catch (error) {
      this.handleError(error as Error, path, value, 'transform')
    }
  }

  /**
   * 处理字段聚焦
   */
  handleFieldFocus(_path: string, _event?: FocusEvent): void {
    // 预留：可以用于实现聚焦时的特殊逻辑
    // 例如：触发校验、显示提示等
  }

  /**
   * 处理字段失焦
   */
  handleFieldBlur(_path: string, _event?: FocusEvent): void {
    // 预留：可以用于实现失焦时的特殊逻辑
    // 例如：触发校验、格式化等
  }

  /**
   * 处理列表添加行
   */
  handleListAdd(path: string, defaultRow?: any): void {
    try {
      const listOperator = this.engine.getListOperator(path)
      const row = defaultRow ?? {}
      listOperator.append(row)
    } catch (error) {
      this.handleError(error as Error, path, defaultRow, 'list-add')
    }
  }

  /**
   * 处理列表删除行
   */
  handleListRemove(path: string, index: number): void {
    try {
      const listOperator = this.engine.getListOperator(path)
      listOperator.remove(index)
    } catch (error) {
      this.handleError(error as Error, path, index, 'list-remove')
    }
  }

  /**
   * 处理列表移动行
   */
  handleListMove(path: string, from: number, to: number): void {
    try {
      const listOperator = this.engine.getListOperator(path)
      listOperator.move(from, to)
    } catch (error) {
      this.handleError(error as Error, path, { from, to }, 'list-move')
    }
  }

  /**
   * 处理列表插入行
   */
  handleListInsert(path: string, index: number, row?: any): void {
    try {
      const listOperator = this.engine.getListOperator(path)
      listOperator.insert(index, row ?? {})
    } catch (error) {
      this.handleError(error as Error, path, { index, row }, 'list-insert')
    }
  }

  /**
   * 批量更新多个字段
   */
  batchUpdate(
    updates: Array<{ path: string; value: any; component?: string }>
  ): void {
    try {
      const transformedUpdates: Record<string, any> = {}

      for (const { path, value, component } of updates) {
        if (component) {
          const definition = this.registry.get(component)
          transformedUpdates[path] = this.transformValue(value, definition)
        } else {
          transformedUpdates[path] = value
        }
      }

      this.engine.updateValue(transformedUpdates)
    } catch (error) {
      this.handleError(error as Error, '', updates, 'batch-update')
    }
  }

  /**
   * 立即刷新所有待处理的批量更新
   */
  flush(): void {
    if (this.batchManager) {
      this.batchManager.flush()
    }
  }

  /**
   * 销毁事件处理器
   */
  destroy(): void {
    if (this.batchManager) {
      this.batchManager.clear()
      this.batchManager = undefined
    }
  }

  /**
   * 应用值转换器
   */
  private transformValue(value: any, definition: any): any {
    if (!definition?.valueTransformer?.fromComponent) {
      return value
    }

    try {
      return definition.valueTransformer.fromComponent(value)
    } catch (error) {
      throw new TransformError(
        `Failed to transform value: ${error}`,
        definition.name,
        value
      )
    }
  }

  /**
   * 更新引擎（支持批量）
   */
  private updateEngine(path: string, value: any): void {
    if (this.batchManager) {
      this.batchManager.scheduleUpdate(path, value)
    } else {
      this.engine.updateValue(path, value)
    }
  }

  /**
   * 统一的错误处理
   */
  private handleError(
    error: Error,
    path: string,
    value: any,
    operation: string
  ): void {
    console.error(`EventHandler error [${operation}] at "${path}":`, error)

    if (error instanceof TransformError) {
      this.options.onTransformError?.(error, path, value)
    } else {
      this.options.onUpdateError?.(error, path, value)
    }
  }
}

/**
 * 值转换错误
 */
export class TransformError extends Error {
  constructor(
    message: string,
    public componentName: string,
    public value: any
  ) {
    super(message)
    this.name = 'TransformError'
  }
}

/**
 * 创建事件处理器实例
 */
export function createEventHandler(
  engine: ReactiveEngine,
  registry: ComponentRegistry,
  options?: EventHandlerOptions
): EventHandler {
  return new EventHandler(engine, registry, options)
}

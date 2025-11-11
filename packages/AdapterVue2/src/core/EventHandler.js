import { Batcher } from '@form-renderer/share'

/**
 * 事件处理器
 *
 * 处理用户交互事件，支持值转换和批量更新
 *
 * @class
 */
export class EventHandler {
  constructor(engine, registry, options = {}) {
    this.engine = engine
    this.registry = registry
    this.options = options

    const { enableBatch = false, batchDelay = 16 } = options

    // 创建批处理器（可选）
    if (enableBatch) {
      this.batcher = new Batcher(
        (items) => this.flushBatchUpdates(items),
        batchDelay
      )
    }
  }

  /**
   * 处理字段值变化
   * @param {string} path - 字段路径
   * @param {*} value - 新值（组件值）
   * @param {string} componentName - 组件名称
   */
  handleFieldChange(path, value, componentName) {
    const componentDef = this.registry.get(componentName)

    // 应用值转换器（组件值 → 引擎值）
    let engineValue = value
    if (componentDef && componentDef.valueTransformer) {
      try {
        engineValue = componentDef.valueTransformer.fromComponent(value)
      } catch (error) {
        console.error(`[EventHandler] Value transform error:`, error)
        return
      }
    }

    // 批量更新或立即更新
    if (this.batcher) {
      this.batcher.add({ path, value: engineValue })
    } else {
      this.engine.updateValue(path, engineValue)
    }
  }

  /**
   * 处理字段失焦
   * @param {string} path - 字段路径
   * @param {Event} event - 失焦事件
   */
  handleFieldBlur(path, event) {
    // 可以触发校验等
    // console.log('[EventHandler] Field blur:', path, event)
  }

  /**
   * 处理字段聚焦
   * @param {string} path - 字段路径
   * @param {Event} event - 聚焦事件
   */
  handleFieldFocus(path, event) {
    // console.log('[EventHandler] Field focus:', path, event)
  }

  /**
   * 处理列表添加
   * @param {string} path - 列表路径
   * @param {*} value - 初始值
   */
  handleListAdd(path, value) {
    const operator = this.engine.getListOperator(path)
    if (operator) {
      operator.add(value)
    }
  }

  /**
   * 处理列表删除
   * @param {string} path - 列表路径
   * @param {number} index - 索引
   */
  handleListRemove(path, index) {
    const operator = this.engine.getListOperator(path)
    if (operator) {
      operator.remove(index)
    }
  }

  /**
   * 处理列表移动
   * @param {string} path - 列表路径
   * @param {number} from - 起始索引
   * @param {number} to - 目标索引
   */
  handleListMove(path, from, to) {
    const operator = this.engine.getListOperator(path)
    if (operator) {
      operator.move(from, to)
    }
  }

  /**
   * 刷新批量更新
   * @param {Object[]} items - 更新项数组
   */
  flushBatchUpdates(items) {
    const updates = {}
    items.forEach(({ path, value }) => {
      updates[path] = value
    })
    this.engine.updateValue(updates)
  }

  /**
   * 立即刷新
   */
  flush() {
    if (this.batcher) {
      this.batcher.flush()
    }
  }

  /**
   * 销毁
   */
  destroy() {
    if (this.batcher) {
      this.batcher.destroy()
      this.batcher = null
    }
  }
}

/**
 * 工厂函数
 * @param {Object} engine - ReactiveEngine 实例
 * @param {Object} registry - ComponentRegistry 实例
 * @param {Object} options - 配置选项
 * @returns {EventHandler}
 */
export function createEventHandler(engine, registry, options) {
  return new EventHandler(engine, registry, options)
}

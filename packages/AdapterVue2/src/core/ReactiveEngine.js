import Vue from 'vue'
import { FormEngine } from '@form-renderer/engine'
import { UpdateScheduler } from './UpdateScheduler'

/**
 * 响应式引擎 - Vue 2.6 版本
 *
 * 核心特性：
 * 1. 使用 Vue.observable 创建响应式数据
 * 2. Engine 已实现结构共享的不可变更新，直接使用引用比较
 * 3. 只在引用变化时触发 Vue 响应式更新
 * 4. 与 AdapterVue3 API 兼容
 *
 * 关键理解：
 * - Engine 的不可变更新：更新节点时，只更新该节点及其父路径，其他节点复用
 * - model 和 renderSchema 都采用这种机制
 * - 因此只需要监听 Engine 事件，直接赋值新引用即可
 *
 * @class
 */
export class ReactiveEngine {
  constructor(options) {
    const { schema, model, enableUpdateScheduler = false } = options

    // 创建 FormEngine 实例
    this.engine = new FormEngine({ schema, model })

    // 创建响应式状态
    // 💡 关键：Engine 已保证结构共享，直接存储引用即可
    this.state = Vue.observable({
      // 存储 Engine 返回的 renderSchema 引用
      // Engine 保证：数据没变，引用不变；数据变了，返回新引用
      renderSchema: this.engine.getRenderSchema(),

      // 存储 Engine 返回的 model 引用
      model: this.engine.getValue()
    })

    this.subscriptions = []
    this.isDestroyed = false

    // 创建更新调度器（可选）
    if (enableUpdateScheduler) {
      this.updateScheduler = new UpdateScheduler(this.engine)
    }

    // 建立响应式连接
    this.setupEventListeners()
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    const unsubscribe = this.engine.onValueChange((event) => {
      if (this.isDestroyed) return
      if (event.event.kind === 'value') {
        this.handleValueChange(event)
      } else if (event.event.kind === 'structure') {
        this.handleStructureChange()
      }
    })

    this.subscriptions.push(unsubscribe)
  }

  /**
   * 处理值变化
   *
   * Engine 已通过结构共享保证：
   * - 如果值真的变了，返回的引用就会变
   * - 如果值没变，返回的引用不变
   *
   * 因此这里只需要：
   * 1. 获取新引用
   * 2. 直接赋值（Vue.observable 会检测引用变化）
   */
  handleValueChange(_event) {
    // 获取新的 model 引用（Engine 已做结构共享优化）
    const newModel = this.engine.getValue()
    // 直接赋值，Vue 会检测引用变化
    // 如果引用相同，Vue 不会触发更新
    // 如果引用不同，Vue 会触发更新
    this.state.model = newModel

    // 同时更新 renderSchema（控制属性可能受 model 影响）
    const newRenderSchema = this.engine.getRenderSchema()
    this.state.renderSchema = newRenderSchema
  }

  /**
   * 处理结构变化
   *
   * 结构变化（如 ifShow 切换）会影响 renderSchema
   * Engine 同样会返回新的 renderSchema 引用
   */
  handleStructureChange() {
    console.log(
      '---> ReactiveEngine handleStructureChange',
      this.engine.getRenderSchema() === this.state.renderSchema
    )
    const newModel = this.engine.getValue()
    this.state.model = newModel
    // 直接获取并赋值新引用
    this.state.renderSchema = this.engine.getRenderSchema()
  }

  /**
   * 获取 RenderSchema（返回响应式引用）
   *
   * 注意：返回的是 Vue.observable 包装的响应式对象
   * 组件中可以直接使用，Vue 会自动追踪依赖
   */
  getRenderSchema() {
    return this.state.renderSchema
  }

  /**
   * 获取 Model（返回响应式引用）
   */
  getModel() {
    return this.state.model
  }

  /**
   * 获取原始 Engine
   */
  getEngine() {
    return this.engine
  }

  /**
   * 更新值（支持单个或批量）
   * @param {string|Object} pathOrValues - 路径或值对象
   * @param {*} value - 值（单个更新时）
   */
  updateValue(pathOrValues, value) {
    if (typeof pathOrValues === 'string') {
      // 单个更新
      this.engine.updateValue(pathOrValues, value)
    } else {
      // 批量更新
      this.engine.updateValues(pathOrValues)
    }
  }

  /**
   * 校验表单
   */
  async validate(paths) {
    return await this.engine.validate(paths)
  }

  /**
   * 重置表单
   */
  async reset(target) {
    await this.engine.reset(target)
  }

  /**
   * 获取列表操作器
   * 返回一个包装了 FormEngine list 方法的对象
   */
  getListOperator(path) {
    if (this.isDestroyed) {
      throw new Error('Cannot get list operator from destroyed ReactiveEngine')
    }
    // 返回一个包装对象，将方法委托给 FormEngine
    return {
      add: (row) => {
        this.engine.listAppend(path, row)
      },
      append: (row) => {
        this.engine.listAppend(path, row)
      },
      insert: (index, row) => this.engine.listInsert(path, index, row),
      remove: (index) => this.engine.listRemove(path, index),
      move: (from, to) => this.engine.listMove(path, from, to),
      swap: (a, b) => this.engine.listSwap(path, a, b),
      replace: (index, row) => this.engine.listReplace(path, index, row),
      clear: () => this.engine.listClear(path)
    }
  }

  /**
   * 设置表单 Schema
   */
  setFormSchema(schema) {
    this.engine.setFormSchema(schema)
    this.handleStructureChange()
  }

  /**
   * 立即刷新
   */
  flush() {
    if (this.updateScheduler) {
      this.updateScheduler.flush()
    }
  }

  /**
   * 等待刷新
   */
  async waitFlush() {
    if (this.updateScheduler) {
      return await this.updateScheduler.waitFlush()
    }
  }

  /**
   * 销毁
   */
  destroy() {
    this.isDestroyed = true
    this.subscriptions.forEach((unsub) => unsub())
    this.subscriptions = []
    if (this.updateScheduler) {
      this.updateScheduler.destroy()
    }
    this.engine.destroy()
  }
}

/**
 * 工厂函数
 * @param {Object} options - 配置选项
 * @returns {ReactiveEngine}
 */
export function createReactiveEngine(options) {
  return new ReactiveEngine(options)
}

<template>
  <div class="form-adapter" :class="rootClass">
    <slot name="before-form" />

    <SchemaRenderer
      v-if="renderSchema && renderContext"
      ref="schemaRenderer"
      :model="currentModel"
      :node="renderSchema"
      :context="renderContext"
      @field-change="handleFieldChange"
      @field-blur="handleFieldBlur"
      @field-focus="handleFieldFocus"
      @list-add="handleListAdd"
      @list-remove="handleListRemove"
      @list-move="handleListMove"
    />

    <slot name="after-form" />
  </div>
</template>

<script>
import SchemaRenderer from './SchemaRenderer.vue'
import {
  createReactiveEngine,
  createComponentRegistry,
  createEventHandler
} from '../core'

export default {
  name: 'FormAdapter',

  components: {
    SchemaRenderer
  },

  props: {
    schema: {
      type: Object,
      required: true
    },
    value: {
      type: Object,
      default: () => ({})
    },
    components: {
      type: [Array, Object],
      default: undefined
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      // 核心实例（非响应式）
      reactiveEngine: null,
      componentRegistry: null,
      eventHandler: null,
      // 响应式状态的直接引用
      reactiveState: null
    }
  },

  computed: {
    /**
     * 渲染 Schema（响应式）
     */
    renderSchema() {
      if (!this.reactiveState) return null
      // 💡 关键：直接访问响应式状态
      return this.reactiveState.renderSchema
    },

    /**
     * 当前 Model（响应式）
     */
    currentModel() {
      if (!this.reactiveState) return null
      console.log('---> currentModel', JSON.stringify(this.reactiveState.model))
      return this.reactiveState.model
    },

    /**
     * 渲染上下文
     */
    renderContext() {
      if (
        !this.reactiveEngine ||
        !this.componentRegistry ||
        !this.eventHandler
      ) {
        return null
      }

      return {
        engine: this.reactiveEngine,
        registry: this.componentRegistry,
        eventHandler: this.eventHandler,
        options: this.options,
        formItem: this.getFormItem(),
        ruleConverter: this.getRuleConverter(),
        path: [],
        depth: 0,
        model: this.currentModel
      }
    },

    /**
     * 根元素类名
     */
    rootClass() {
      const classes = []
      if (
        this.options &&
        this.options.theme &&
        this.options.theme.classPrefix
      ) {
        classes.push(`${this.options.theme.classPrefix}form-adapter`)
      }
      if (this.options && this.options.theme && this.options.theme.size) {
        classes.push(`size-${this.options.theme.size}`)
      }
      return classes
    }
  },

  watch: {
    /**
     * 监听 schema 变化
     */
    schema: {
      handler(newSchema) {
        if (this.reactiveEngine && newSchema) {
          this.reactiveEngine.setFormSchema(newSchema)
        }
      },
      deep: true
    },

    /**
     * 监听 model 变化，向外通知
     */
    currentModel(newModel) {
      this.$emit('input', newModel)
    }
  },

  created() {
    this.init()
  },

  beforeDestroy() {
    this.destroy()
  },

  methods: {
    /**
     * 初始化
     */
    init() {
      // 1. 创建组件注册表
      this.componentRegistry = createComponentRegistry()

      // 2. 注册组件
      if (this.components) {
        if (Array.isArray(this.components)) {
          this.componentRegistry.registerBatch(this.components)
        } else {
          this.componentRegistry.registerPreset(this.components)
        }
      }

      // 3. 创建响应式引擎
      this.reactiveEngine = createReactiveEngine({
        schema: this.schema,
        model: this.value,
        enableUpdateScheduler:
          this.options &&
          this.options.engine &&
          this.options.engine.enableUpdateScheduler
      })

      // 💡 关键：直接引用响应式状态，建立响应式连接
      this.reactiveState = this.reactiveEngine.state

      // 4. 创建事件处理器
      this.eventHandler = createEventHandler(
        this.reactiveEngine,
        this.componentRegistry,
        {
          enableBatch:
            this.options &&
            this.options.eventHandler &&
            this.options.eventHandler.enableBatch,
          batchDelay:
            this.options &&
            this.options.eventHandler &&
            this.options.eventHandler.batchDelay
        }
      )

      // 5. 触发 ready 事件
      this.$emit('ready', this.reactiveEngine)
    },

    /**
     * 获取 FormItem 组件
     */
    getFormItem() {
      if (this.options && this.options.formItem) {
        return this.options.formItem
      }
      if (
        !Array.isArray(this.components) &&
        this.components &&
        this.components.formItem
      ) {
        return this.components.formItem
      }
      return undefined
    },

    /**
     * 获取规则转换器
     */
    getRuleConverter() {
      if (
        !Array.isArray(this.components) &&
        this.components &&
        this.components.ruleConverter
      ) {
        return this.components.ruleConverter
      }
      return undefined
    },

    // ============ 事件处理 ============

    handleFieldChange(event) {
      this.eventHandler.handleFieldChange(
        event.path,
        event.value,
        event.component
      )
      this.$emit('change', { path: event.path, value: event.value })
    },

    handleFieldBlur(event) {
      this.eventHandler.handleFieldBlur(event.path, event.event)
      this.$emit('field-blur', event)
    },

    handleFieldFocus(event) {
      this.eventHandler.handleFieldFocus(event.path, event.event)
      this.$emit('field-focus', event)
    },

    handleListAdd(event) {
      this.eventHandler.handleListAdd(event.path, event.value)
      this.$emit('list-change', { path: event.path, operation: 'add' })
    },

    handleListRemove(event) {
      this.eventHandler.handleListRemove(event.path, event.index)
      this.$emit('list-change', {
        path: event.path,
        operation: 'remove',
        index: event.index
      })
    },

    handleListMove(event) {
      this.eventHandler.handleListMove(event.path, event.from, event.to)
      this.$emit('list-change', {
        path: event.path,
        operation: 'move',
        from: event.from,
        to: event.to
      })
    },

    // ============ 公共 API ============

    /**
     * 获取值
     */
    getValue(path) {
      if (!this.reactiveEngine) return undefined
      if (path) {
        return this.reactiveEngine.getEngine().getValue(path)
      }
      return this.reactiveEngine.getModel()
    },

    /**
     * 更新值
     */
    updateValue(pathOrValues, value) {
      if (this.reactiveEngine) {
        this.reactiveEngine.updateValue(pathOrValues, value)
      }
    },

    /**
     * 校验表单
     */
    async validate(paths) {
      if (!this.reactiveEngine) {
        return { ok: false, errors: [], errorByPath: {} }
      }

      // 如果有 ruleConverter，尝试使用 UI 框架校验
      const hasRuleConverter =
        !Array.isArray(this.components) &&
        this.components &&
        this.components.ruleConverter

      if (hasRuleConverter) {
        const uiForm = this.getUIFormInstance()
        if (uiForm && typeof uiForm.validate === 'function') {
          try {
            const valid = await uiForm.validate()
            if (valid) {
              const result = true
              this.$emit('validate', result)
              return result
            }
          } catch (errors) {
            // 转换错误格式
            const result = this.convertValidationErrors(errors)
            this.$emit('validate', result)
            return result
          }
        }
      }

      // 回退到 Engine 校验
      const result = await this.reactiveEngine.validate(paths)
      this.$emit('validate', result)
      return result
    },

    /**
     * 提交表单
     */
    async submit() {
      const result = await this.validate()
      if (result === true) {
        const model = this.reactiveEngine.getModel()
        this.$emit('submit', model)
      }
    },

    /**
     * 重置表单
     */
    async reset(target) {
      if (this.reactiveEngine) {
        await this.reactiveEngine.reset(target)
      }
    },

    /**
     * 获取列表操作器
     */
    getListOperator(path) {
      if (this.reactiveEngine) {
        return this.reactiveEngine.getListOperator(path)
      }
    },

    /**
     * 立即刷新
     */
    flush() {
      if (this.eventHandler) {
        this.eventHandler.flush()
      }
      if (this.reactiveEngine) {
        this.reactiveEngine.flush()
      }
    },

    /**
     * 获取 UI 表单实例
     */
    getUIFormInstance() {
      const schemaRenderer = this.$refs.schemaRenderer
      if (!schemaRenderer) return null
      const formContainer = schemaRenderer.containerRef
      return formContainer ? formContainer.formRef : null
    },

    /**
     * 转换校验错误
     */
    convertValidationErrors(errors) {
      const errorList = []
      const errorByPath = {}

      if (Array.isArray(errors)) {
        errors.forEach((err) => {
          const error = {
            path: err.field || '',
            message: err.message || '校验失败',
            code: 'VALIDATION_ERROR'
          }
          errorList.push(error)
          if (!errorByPath[error.path]) {
            errorByPath[error.path] = []
          }
          errorByPath[error.path].push(error)
        })
      }

      return { ok: false, errors: errorList, errorByPath }
    },

    /**
     * 销毁
     */
    destroy() {
      if (this.eventHandler) {
        this.eventHandler.destroy()
      }
      if (this.reactiveEngine) {
        this.reactiveEngine.destroy()
      }
    }
  }
}
</script>

<style scoped>
.form-adapter {
  width: 100%;
  box-sizing: border-box;
}

.size-large {
  font-size: 16px;
}

.size-default {
  font-size: 14px;
}

.size-small {
  font-size: 12px;
}
</style>

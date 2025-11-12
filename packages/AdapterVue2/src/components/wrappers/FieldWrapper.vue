<template>
  <component
    v-if="needFormItem && FormItem"
    :is="FormItem"
    v-bind="formItemProps"
    :class="formItemClass"
  >
    <component
      :is="fieldComponent"
      v-bind="fieldProps"
      v-model="componentValue"
      @change="handleChange"
      @blur="handleBlur"
      @focus="handleFocus"
    />
  </component>

  <component
    v-else
    :is="fieldComponent"
    v-bind="fieldProps"
    v-model="componentValue"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
  />
</template>

<script>
export default {
  name: 'FieldWrapper',

  props: {
    node: {
      type: Object,
      required: true
    },
    context: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      // 【核心机制】标记是否是用户操作
      isUserAction: true,
      // 组件值（与组件绑定，经过 transformer.toComponent 转换）
      componentValue: undefined
    }
  },

  computed: {
    computed() {
      return this.node.computed || {}
    },

    componentDef() {
      const componentName = this.node.component
      return this.context.registry.get(componentName)
    },

    fieldComponent() {
      if (!this.componentDef) {
        console.warn(
          `[FieldWrapper] Component not found: ${this.node.component}`
        )
        return null
      }
      return this.componentDef.component
    },

    // FormItem 组件
    FormItem() {
      if (!this.componentDef || !this.componentDef.needFormItem) {
        return null
      }
      return this.context.formItem || null
    },

    // 是否需要 FormItem 包装
    needFormItem() {
      // 默认需要 FormItem，除非组件定义明确设置为 false
      return this.componentDef?.needFormItem !== false
    },

    // 从 Engine 获取字段值
    fieldValue() {
      const path = this.node.path
      // 使用 Engine 的 getValue 方法获取值，支持嵌套路径
      return this.context.engine.getEngine().getValue(path)
    },

    fieldProps() {
      // 优先使用 computed 中计算好的 componentProps（函数式 componentProps）
      const dynamicProps =
        this.computed.componentProps || this.node.componentProps

      const props = {
        ...this.componentDef?.defaultProps,
        ...dynamicProps,
        disabled: this.computed.disabled,
        readonly: this.computed.readonly,
        placeholder: this.node.placeholder
      }

      return props
    },

    // FormItem 属性
    formItemProps() {
      // 调用转换函数生成 rules（如果提供了 ruleConverter）
      const rules = this.context.ruleConverter
        ? this.context.ruleConverter(this.node, this.computed, this.context)
        : undefined

      // 优先使用 computed 中计算好的 formItemProps（函数式 formItemProps）
      const dynamicProps =
        this.computed.formItemProps || this.node.formItemProps

      return {
        label: this.node.label,
        prop: this.node.path, // Element UI 使用 prop，Ant Design Vue 使用 name
        name: this.node.path, // 兼容不同 UI 框架
        required: this.computed.required,
        rules: rules,
        ...dynamicProps
      }
    },

    // FormItem 类名
    formItemClass() {
      const classes = []
      if (this.computed.show === false) {
        classes.push('hidden')
      }
      return classes
    }
  },

  watch: {
    // 监听 engine 中的字段值变化
    fieldValue: {
      handler(newValue) {
        // 标记为非用户操作
        this.isUserAction = false

        // 应用值转换器（Engine → Component）
        let transformedValue = newValue
        if (this.componentDef && this.componentDef.valueTransformer) {
          try {
            transformedValue =
              this.componentDef.valueTransformer.toComponent(newValue)
          } catch (error) {
            console.error('[FieldWrapper] Value transform error:', error)
          }
        }

        this.componentValue = transformedValue

        // 下一个 tick 恢复标记
        this.$nextTick(() => {
          this.isUserAction = true
        })
      },
      immediate: true
    }
  },

  methods: {
    handleInput(value) {
      // Vue 2 使用 input 事件
      this.handleChange(value)
    },

    handleChange(value) {
      // 只有用户操作才通知 engine
      if (!this.isUserAction) {
        return
      }

      // 应用值转换器（组件值 → 引擎值）
      let engineValue = value
      if (this.componentDef && this.componentDef.valueTransformer) {
        try {
          engineValue = this.componentDef.valueTransformer.fromComponent(value)
        } catch (error) {
          console.error('[FieldWrapper] Value transform error:', error)
        }
      }

      this.$emit('field-change', {
        path: this.node.path,
        value: engineValue,
        component: this.node.component
      })
    },

    handleBlur(event) {
      this.$emit('field-blur', {
        path: this.node.path,
        event
      })
    },

    handleFocus(event) {
      this.$emit('field-focus', {
        path: this.node.path,
        event
      })
    }
  }
}
</script>

<style scoped>
.hidden {
  display: none;
}
</style>

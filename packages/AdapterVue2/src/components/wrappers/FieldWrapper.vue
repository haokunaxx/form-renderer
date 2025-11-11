<template>
  <component
    :is="fieldComponent"
    v-if="computed.show"
    v-bind="fieldProps"
    :value="fieldValue"
    @input="handleInput"
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

    fieldValue() {
      const path = this.node.path
      const model = this.context.engine.getModel()
      let value = model[path]

      // 应用值转换器（引擎值 → 组件值）
      if (this.componentDef && this.componentDef.valueTransformer) {
        try {
          value = this.componentDef.valueTransformer.toComponent(value)
        } catch (error) {
          console.error('[FieldWrapper] Value transform error:', error)
        }
      }

      return value
    },

    fieldProps() {
      const props = {
        ...this.componentDef?.defaultProps,
        ...this.node.componentProps,
        disabled: this.computed.disabled,
        readonly: this.computed.readonly
      }

      return props
    }
  },

  methods: {
    handleInput(value) {
      // Vue 2 使用 input 事件
      this.handleChange(value)
    },

    handleChange(value) {
      this.$emit('field-change', {
        path: this.node.path,
        value,
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

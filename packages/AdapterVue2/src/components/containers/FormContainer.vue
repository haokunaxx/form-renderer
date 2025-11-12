<template>
  <component
    :is="formComponent || 'div'"
    ref="formRef"
    v-bind="formProps"
    :class="formClass"
    @submit.prevent="handleSubmit"
  >
    <slot name="before-form" />

    <SchemaRenderer
      v-for="(child, index) in children"
      :key="child.path || index"
      :node="child"
      :context="childContext"
      @field-change="handleFieldChange"
      @field-blur="handleFieldBlur"
      @field-focus="handleFieldFocus"
      @list-add="handleListAdd"
      @list-remove="handleListRemove"
      @list-move="handleListMove"
    />

    <slot name="after-form" />
  </component>
</template>

<script>
export default {
  name: 'FormContainer',

  components: {
    SchemaRenderer: () => import('../SchemaRenderer.vue')
  },

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
    // 表单组件
    formComponent() {
      if (this.node.component) {
        const componentDef = this.context.registry.get(this.node.component)
        return componentDef?.component
      }
      return null
    },

    // 表单属性
    formProps() {
      return {
        ...this.node.formProps,
        ...this.node.componentProps,
        model: this.context.engine?.getModel()
      }
    },

    // 表单类名
    formClass() {
      const classes = ['form-adapter-root']
      if (this.context.options?.theme?.classPrefix) {
        classes.push(`${this.context.options.theme.classPrefix}form`)
      }
      return classes
    },

    // 子节点
    children() {
      return this.node.children || []
    },

    // 子上下文
    childContext() {
      return {
        ...this.context,
        depth: this.context.depth + 1,
        parentType: 'form'
      }
    }
  },

  methods: {
    // 处理提交
    handleSubmit() {
      this.$emit('submit')
    },

    // 转发字段事件
    handleFieldChange(event) {
      this.$emit('field-change', event)
    },

    handleFieldBlur(event) {
      this.$emit('field-blur', event)
    },

    handleFieldFocus(event) {
      this.$emit('field-focus', event)
    },

    // 转发列表事件
    handleListAdd(event) {
      this.$emit('list-add', event)
    },

    handleListRemove(event) {
      this.$emit('list-remove', event)
    },

    handleListMove(event) {
      this.$emit('list-move', event)
    },

    // 暴露表单方法供外部调用
    validate(callback) {
      // const formRef = this.$refs.formRef
      // if (formRef && typeof formRef.validate === 'function') {
      //   return formRef.validate(callback)
      // }
      // return Promise.resolve(true)
    },

    validateField(props, callback) {
      const formRef = this.$refs.formRef
      if (formRef && typeof formRef.validateField === 'function') {
        return formRef.validateField(props, callback)
      }
    },

    resetFields() {
      const formRef = this.$refs.formRef
      if (formRef && typeof formRef.resetFields === 'function') {
        formRef.resetFields()
      }
    },

    clearValidate(props) {
      const formRef = this.$refs.formRef
      if (formRef && typeof formRef.clearValidate === 'function') {
        formRef.clearValidate(props)
      }
    }
  }
}
</script>

<style scoped>
.form-adapter-root {
  width: 100%;
}
</style>

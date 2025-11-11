<template>
  <component
    :is="containerComponent"
    v-if="node && containerComponent"
    ref="containerRef"
    v-bind="containerProps"
    @field-change="$emit('field-change', $event)"
    @field-blur="$emit('field-blur', $event)"
    @field-focus="$emit('field-focus', $event)"
    @list-add="$emit('list-add', $event)"
    @list-remove="$emit('list-remove', $event)"
    @list-move="$emit('list-move', $event)"
  />
</template>

<script>
import FormContainer from './containers/FormContainer.vue'
import LayoutContainer from './containers/LayoutContainer.vue'
import ListContainer from './containers/ListContainer.vue'
import FieldWrapper from './wrappers/FieldWrapper.vue'

export default {
  name: 'SchemaRenderer',

  components: {
    FormContainer,
    LayoutContainer,
    ListContainer,
    FieldWrapper
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
    /**
     * 容器组件
     */
    containerComponent() {
      if (!this.node) return null

      const { type } = this.node

      switch (type) {
        case 'form':
          return 'FormContainer'
        case 'layout':
          return 'LayoutContainer'
        case 'list':
          return 'ListContainer'
        case 'field':
          return 'FieldWrapper'
        default:
          console.warn(`[SchemaRenderer] Unknown node type: ${type}`)
          return null
      }
    },

    /**
     * 容器属性
     */
    containerProps() {
      return {
        node: this.node,
        context: this.context
      }
    },

    /**
     * 容器引用
     */
    containerRef() {
      return this.$refs.containerRef
    }
  }
}
</script>

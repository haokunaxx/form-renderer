<template>
  <component
    v-if="shouldRender"
    :is="containerComponent"
    ref="containerRef"
    :node="node"
    :context="context"
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
     * 判断节点是否应该渲染
     * ifShow 控制节点是否在 DOM 中（v-if）
     */
    shouldRender() {
      return this.node.computed?.ifShow !== false
    },

    /**
     * 根据节点类型选择对应的渲染组件
     */
    containerComponent() {
      if (!this.node) return null

      const renderers = {
        form: 'FormContainer',
        layout: 'LayoutContainer',
        list: 'ListContainer',
        field: 'FieldWrapper'
      }

      const component = renderers[this.node.type]
      if (!component) {
        console.warn(`[SchemaRenderer] Unknown node type: ${this.node.type}`)
        return null
      }

      return component
    }
  }
}
</script>

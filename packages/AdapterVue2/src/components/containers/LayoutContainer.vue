<template>
  <div class="layout-container" v-if="computed.show">
    <SchemaRenderer
      v-for="(child, key) in childNodes"
      :key="key"
      :node="child"
      :context="childContext"
      @field-change="$emit('field-change', $event)"
      @field-blur="$emit('field-blur', $event)"
      @field-focus="$emit('field-focus', $event)"
      @list-add="$emit('list-add', $event)"
      @list-remove="$emit('list-remove', $event)"
      @list-move="$emit('list-move', $event)"
    />
  </div>
</template>

<script>
export default {
  name: 'LayoutContainer',

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

    childNodes() {
      return this.node.children || []
    },

    childContext() {
      return {
        ...this.context,
        path: [...this.context.path, this.node.path].filter(Boolean),
        depth: this.context.depth + 1,
        parentType: 'layout'
      }
    }
  }
}
</script>

<style scoped>
.layout-container {
  width: 100%;
}
</style>

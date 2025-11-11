<template>
  <div class="form-container">
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
  name: 'FormContainer',

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
    childNodes() {
      return this.node.children || []
    },

    childContext() {
      return {
        ...this.context,
        depth: this.context.depth + 1,
        parentType: 'form'
      }
    }
  }
}
</script>

<style scoped>
.form-container {
  width: 100%;
}
</style>

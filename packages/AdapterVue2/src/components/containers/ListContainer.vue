<template>
  <div class="list-container" v-if="computed.show">
    <div v-for="(item, index) in rows" :key="index" class="list-item">
      <SchemaRenderer
        v-for="(child, key) in childNodes"
        :key="key"
        :node="child"
        :context="getRowContext(index)"
        @field-change="$emit('field-change', $event)"
        @field-blur="$emit('field-blur', $event)"
        @field-focus="$emit('field-focus', $event)"
        @list-add="$emit('list-add', $event)"
        @list-remove="$emit('list-remove', $event)"
        @list-move="$emit('list-move', $event)"
      />

      <button
        v-if="!computed.disabled"
        type="button"
        class="list-remove-btn"
        @click="handleRemove(index)"
      >
        删除
      </button>
    </div>

    <button
      v-if="!computed.disabled"
      type="button"
      class="list-add-btn"
      @click="handleAdd"
    >
      添加
    </button>
  </div>
</template>

<script>
export default {
  name: 'ListContainer',

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

    rows() {
      const path = this.node.path
      const model = this.context.engine.getModel()
      return model[path] || []
    },

    childNodes() {
      return this.node.children || []
    }
  },

  methods: {
    getRowContext(index) {
      return {
        ...this.context,
        path: [...this.context.path, this.node.path, index].filter(
          (p) => p !== '' && p !== null && p !== undefined
        ),
        depth: this.context.depth + 1,
        parentType: 'list',
        rowIndex: index
      }
    },

    handleAdd() {
      this.$emit('list-add', {
        path: this.node.path,
        value: undefined
      })
    },

    handleRemove(index) {
      this.$emit('list-remove', {
        path: this.node.path,
        index
      })
    }
  }
}
</script>

<style scoped>
.list-container {
  width: 100%;
}

.list-item {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.list-add-btn,
.list-remove-btn {
  padding: 5px 10px;
  margin-top: 5px;
  cursor: pointer;
}
</style>

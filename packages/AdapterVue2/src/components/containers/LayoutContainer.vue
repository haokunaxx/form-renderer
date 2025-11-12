<template>
  <div>
    <component
      v-if="layoutComponent"
      :is="layoutComponent"
      v-bind="componentProps"
      :class="containerClass"
    >
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
    </component>

    <template v-else>
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
    </template>
  </div>
</template>

<script>
export default {
  name: 'LayoutContainer',

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
    // 布局组件
    layoutComponent() {
      if (this.node.component) {
        const componentDef = this.context.registry.get(this.node.component)
        return componentDef?.component
      }
      return null
    },

    // 组件属性
    componentProps() {
      return {
        ...this.node.componentProps
      }
    },

    // 容器类名（根据 show 控制属性添加 hidden 类）
    containerClass() {
      const classes = ['layout-container']
      if (this.computed.show === false) {
        classes.push('hidden')
      }
      return classes
    },

    computed() {
      return this.node.computed || {}
    },

    // 子节点（layout 的 children 总是一维数组）
    children() {
      const nodeChildren = this.node.children
      return Array.isArray(nodeChildren) && !Array.isArray(nodeChildren[0])
        ? nodeChildren
        : []
    },

    // 子上下文
    childContext() {
      return {
        ...this.context,
        depth: this.context.depth + 1,
        parentType: 'layout'
      }
    }
  },

  methods: {
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
    }
  }
}
</script>

<style scoped>
.hidden {
  display: none;
}
</style>

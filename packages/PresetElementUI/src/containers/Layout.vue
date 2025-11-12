<template>
  <!-- 根据 type 动态选择 Element UI 布局组件 -->
  <el-row
    v-if="type === 'grid'"
    v-bind="componentProps"
    :class="containerClass"
  >
    <slot />
  </el-row>

  <el-tabs
    v-else-if="type === 'tabs'"
    v-bind="componentProps"
    :class="containerClass"
  >
    <slot />
  </el-tabs>

  <el-collapse
    v-else-if="type === 'collapse'"
    v-bind="componentProps"
    :class="containerClass"
  >
    <slot />
  </el-collapse>

  <el-card
    v-else-if="type === 'card'"
    v-bind="componentProps"
    :class="containerClass"
  >
    <slot />
  </el-card>

  <!-- 默认：直接渲染子元素 -->
  <div v-else :class="containerClass">
    <slot />
  </div>
</template>

<script>
/**
 * 布局容器组件
 */
export default {
  name: 'ContainerLayout',

  props: {
    /**
     * 布局类型
     * - grid: 网格布局（ElRow）
     * - tabs: 标签页布局（ElTabs）
     * - collapse: 折叠面板布局（ElCollapse）
     * - card: 卡片容器（ElCard）
     */
    type: {
      type: String,
      default: 'card',
      validator: (value) =>
        ['grid', 'tabs', 'collapse', 'card', 'div'].includes(value)
    },
    // 其他 props 会通过 $attrs 传递给实际组件
    shadow: String,
    gutter: Number,
    justify: String,
    align: String
  },

  computed: {
    // 组件属性（过滤掉 type）
    componentProps() {
      const props = Object.assign({}, this.$attrs)
      // 手动添加定义的 props（除了 type）
      if (this.shadow) props.shadow = this.shadow
      if (this.gutter !== undefined) props.gutter = this.gutter
      if (this.justify) props.justify = this.justify
      if (this.align) props.align = this.align
      return props
    },

    // 容器类名
    containerClass() {
      return ['element-ui-layout', `element-ui-layout--${this.type}`]
    }
  }
}
</script>

<style scoped>
.element-ui-layout {
  width: 100%;
}
</style>

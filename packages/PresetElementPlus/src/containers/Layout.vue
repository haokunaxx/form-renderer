<template>
  <!-- 根据 type 动态选择 ElementPlus 布局组件 -->
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

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /**
   * 布局类型
   * - grid: 网格布局（ElRow）
   * - tabs: 标签页布局（ElTabs）
   * - collapse: 折叠面板布局（ElCollapse）
   * - card: 卡片容器（ElCard）
   */
  type?: 'grid' | 'tabs' | 'collapse' | 'card'
  /**
   * ElementPlus 组件属性
   */
  [key: string]: any
}

const props = withDefaults(defineProps<Props>(), {
  type: 'card'
})

// 组件属性（过滤掉 type）
const componentProps = computed(() => {
  const { type, ...rest } = props
  return rest
})

// 容器类名
const containerClass = computed(() => {
  const classes: string[] = [
    'element-plus-layout',
    `element-plus-layout--${props.type}`
  ]
  return classes
})
</script>

<style scoped>
.element-plus-layout {
  width: 100%;
}
</style>

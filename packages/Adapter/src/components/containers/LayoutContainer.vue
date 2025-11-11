<template>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RenderNode } from '@form-renderer/engine'
import type { RenderContext } from '../../types'
import SchemaRenderer from '../SchemaRenderer.vue'

interface Props {
  node: RenderNode
  context: RenderContext
}

interface Emits {
  (
    e: 'field-change',
    event: { path: string; value: any; component: string }
  ): void
  (e: 'field-blur', event: { path: string; event: FocusEvent }): void
  (e: 'field-focus', event: { path: string; event: FocusEvent }): void
  (e: 'list-add', event: { path: string }): void
  (e: 'list-remove', event: { path: string; index: number }): void
  (e: 'list-move', event: { path: string; from: number; to: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 布局组件
const layoutComponent = computed(() => {
  if (props.node.component) {
    return props.context.registry.get(props.node.component)?.component
  }
  return null
})

// 组件属性
const componentProps = computed(() => ({
  ...props.node.componentProps
}))

// 容器类名（根据 show 控制属性添加 hidden 类）
const containerClass = computed(() => {
  const classes: string[] = ['layout-container']
  if (props.node.computed?.show === false) {
    classes.push('hidden')
  }
  return classes
})

// 子节点（layout 的 children 总是一维数组）
const children = computed(() => {
  const nodeChildren = props.node.children
  return Array.isArray(nodeChildren) && !Array.isArray(nodeChildren[0])
    ? (nodeChildren as RenderNode[])
    : []
})

// 子上下文
const childContext = computed<RenderContext>(() => ({
  ...props.context,
  depth: props.context.depth + 1,
  parentType: 'layout'
}))

// 转发字段事件
const handleFieldChange = (event: {
  path: string
  value: any
  component: string
}) => {
  emit('field-change', event)
}

const handleFieldBlur = (event: { path: string; event: FocusEvent }) => {
  emit('field-blur', event)
}

const handleFieldFocus = (event: { path: string; event: FocusEvent }) => {
  emit('field-focus', event)
}

// 转发列表事件
const handleListAdd = (event: { path: string }) => {
  emit('list-add', event)
}

const handleListRemove = (event: { path: string; index: number }) => {
  emit('list-remove', event)
}

const handleListMove = (event: { path: string; from: number; to: number }) => {
  emit('list-move', event)
}
</script>

<style scoped>
.hidden {
  display: none;
}
</style>

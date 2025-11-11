<template>
  <component
    v-if="shouldRender"
    :is="getNodeRenderer"
    :node="node"
    :context="context"
    ref="containerRef"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RenderNode } from '@form-renderer/engine'
import type { RenderContext } from '../types'
import FormContainer from './containers/FormContainer.vue'
import LayoutContainer from './containers/LayoutContainer.vue'
import ListContainer from './containers/ListContainer.vue'
import FieldWrapper from './wrappers/FieldWrapper.vue'

interface Props {
  node: RenderNode
  context: RenderContext
}

const props = defineProps<Props>()

const containerRef = ref()

/**
 * 判断节点是否应该渲染
 * ifShow 控制节点是否在 DOM 中（v-if）
 */
const shouldRender = computed(() => {
  return props.node.computed?.ifShow !== false
})

// 根据节点类型选择对应的渲染组件
const getNodeRenderer = computed(() => {
  const renderers: Record<string, any> = {
    form: FormContainer,
    layout: LayoutContainer,
    list: ListContainer,
    field: FieldWrapper
  }
  return renderers[props.node.type] || FormContainer
})

// 暴露容器引用，用于访问 Form 实例
defineExpose({
  containerRef
})
</script>

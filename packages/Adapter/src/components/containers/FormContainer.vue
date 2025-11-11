<template>
  <component
    :is="formComponent || 'div'"
    ref="formRef"
    v-bind="formProps"
    :class="formClass"
    @submit.prevent="handleSubmit"
  >
    <slot name="before-form" />

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

    <slot name="after-form" />
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RenderNode } from '@form-renderer/engine'
import type { RenderContext } from '../../types'
import SchemaRenderer from '../SchemaRenderer.vue'

interface Props {
  node: RenderNode
  context: RenderContext
}

interface Emits {
  (e: 'submit'): void
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

// Form 组件引用
const formRef = ref()

// 表单组件
const formComponent = computed(() => {
  if (props.node.component) {
    return props.context.registry.get(props.node.component)?.component
  }
  return null
})

// 表单属性
const formProps = computed(() => ({
  ...props.node.formProps,
  ...props.node.componentProps,
  // 传递 model 给 Form 组件（Element Plus 的 el-form 需要）
  modelValue: props.context.engine?.getModel().value
}))

// 表单类名
const formClass = computed(() => {
  const classes: string[] = ['form-adapter-root']
  if (props.context.options?.theme?.classPrefix) {
    classes.push(`${props.context.options.theme.classPrefix}form`)
  }
  return classes
})

// 子节点
const children = computed(() => props.node.children || [])

// 子上下文
const childContext = computed<RenderContext>(() => ({
  ...props.context,
  depth: props.context.depth + 1,
  parentType: 'form'
}))

// 处理提交
const handleSubmit = () => {
  emit('submit')
}

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

// 暴露 Form 引用供 FormAdapter 使用
defineExpose({
  formRef
})
</script>

<style scoped>
.form-adapter-root {
  width: 100%;
}
</style>

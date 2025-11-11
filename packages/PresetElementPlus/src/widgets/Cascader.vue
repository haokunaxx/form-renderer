<template>
  <el-cascader
    :model-value="value"
    @update:model-value="handleChange"
    :options="options"
    :disabled="disabled"
    :placeholder="placeholder"
    :size="size"
    :clearable="clearable"
    :filterable="filterable"
    :show-all-levels="showAllLevels"
    :collapse-tags="collapseTags"
    :collapse-tags-tooltip="collapseTagsTooltip"
    :separator="separator"
    :props="cascaderProps"
    v-bind="$attrs"
    @change="handleNativeChange"
    @visible-change="handleVisibleChange"
  />
</template>

<script setup lang="ts">
import { ElCascader } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface CascaderOption {
  value: string | number
  label: string
  children?: CascaderOption[]
  disabled?: boolean
  [key: string]: any
}

export interface CascaderProps extends FieldComponentProps {
  options?: CascaderOption[]
  size?: 'large' | 'default' | 'small'
  clearable?: boolean
  filterable?: boolean
  showAllLevels?: boolean
  collapseTags?: boolean
  collapseTagsTooltip?: boolean
  separator?: string
  cascaderProps?: {
    expandTrigger?: 'click' | 'hover'
    multiple?: boolean
    checkStrictly?: boolean
    emitPath?: boolean
    lazy?: boolean
    lazyLoad?: (node: any, resolve: (data: any[]) => void) => void
    value?: string
    label?: string
    children?: string
    disabled?: string
    leaf?: string
  }
  onVisibleChange?: (visible: boolean) => void
}

const props = withDefaults(defineProps<CascaderProps>(), {
  options: () => [],
  size: 'default',
  clearable: true,
  filterable: false,
  showAllLevels: true,
  collapseTags: false,
  collapseTagsTooltip: false,
  separator: ' / '
})

const emit = defineEmits<{
  change: [value: any]
  'visible-change': [visible: boolean]
}>()

const handleChange = (value: any) => {
  props.onChange?.(value)
  emit('change', value)
}

const handleNativeChange = (value: any) => {
  // Element Plus Cascader 已经通过 update:model-value 触发了 handleChange
  // 这里的 change 事件是原生事件，可以用于额外的处理
}

const handleVisibleChange = (visible: boolean) => {
  props.onVisibleChange?.(visible)
  emit('visible-change', visible)
}
</script>

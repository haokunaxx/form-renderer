<template>
  <el-select
    :model-value="modelValue"
    @update:model-value="handleChange"
    :disabled="disabled"
    :size="size"
    :clearable="clearable"
    :filterable="filterable"
    :multiple="multiple"
    :placeholder="placeholder"
    :loading="loading"
    :loading-text="loadingText"
    :no-data-text="noDataText"
    :no-match-text="noMatchText"
    :remote="remote"
    :remote-method="remoteMethod"
    :allow-create="allowCreate"
    :default-first-option="defaultFirstOption"
    :reserve-keyword="reserveKeyword"
    :collapse-tags="collapseTags"
    :collapse-tags-tooltip="collapseTagsTooltip"
    :multiple-limit="multipleLimit"
    v-bind="$attrs"
  >
    <el-option
      v-for="option in options"
      :key="String(option.value)"
      :label="option.label"
      :value="option.value"
      :disabled="option.disabled"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ElSelect, ElOption } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface SelectOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export interface SelectProps extends FieldComponentProps {
  options: SelectOption[]
  size?: 'large' | 'default' | 'small'
  clearable?: boolean
  filterable?: boolean
  multiple?: boolean
  placeholder?: string
  loading?: boolean
  loadingText?: string
  noDataText?: string
  noMatchText?: string
  remote?: boolean
  remoteMethod?: (query: string) => void
  allowCreate?: boolean
  defaultFirstOption?: boolean
  reserveKeyword?: boolean
  collapseTags?: boolean
  collapseTagsTooltip?: boolean
  multipleLimit?: number
}

const props = withDefaults(defineProps<SelectProps>(), {
  size: 'default',
  options: () => [],
  clearable: false,
  filterable: false,
  multiple: false,
  loading: false,
  remote: false,
  allowCreate: false,
  defaultFirstOption: false,
  reserveKeyword: true,
  collapseTags: false,
  collapseTagsTooltip: false,
  multipleLimit: 0
})

const emit = defineEmits<{
  change: [value: string | number | boolean | (string | number | boolean)[]]
}>()

const handleChange = (
  value: string | number | boolean | (string | number | boolean)[]
) => {
  props.onChange?.(value)
  emit('change', value)
}
</script>

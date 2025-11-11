<template>
  <el-time-picker
    :model-value="value"
    @update:model-value="handleChange"
    :disabled="disabled"
    :placeholder="placeholder"
    :size="size"
    :clearable="clearable"
    :format="format"
    :value-format="valueFormat"
    :is-range="isRange"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :range-separator="rangeSeparator"
    :arrow-control="arrowControl"
    :editable="editable"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { ElTimePicker } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface TimePickerProps extends FieldComponentProps {
  size?: 'large' | 'default' | 'small'
  clearable?: boolean
  format?: string
  valueFormat?: string
  isRange?: boolean
  startPlaceholder?: string
  endPlaceholder?: string
  rangeSeparator?: string
  arrowControl?: boolean
  editable?: boolean
}

const props = withDefaults(defineProps<TimePickerProps>(), {
  size: 'default',
  clearable: true,
  format: 'HH:mm:ss',
  valueFormat: 'HH:mm:ss',
  isRange: false,
  startPlaceholder: '开始时间',
  endPlaceholder: '结束时间',
  rangeSeparator: '-',
  arrowControl: false,
  editable: true
})

const emit = defineEmits<{
  change: [value: string | string[] | null]
}>()

const handleChange = (value: string | string[] | null) => {
  props.onChange?.(value)
  emit('change', value)
}
</script>

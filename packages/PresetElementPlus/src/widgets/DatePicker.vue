<template>
  <el-date-picker
    :model-value="modelValue"
    @update:model-value="handleChange"
    :disabled="disabled"
    :size="size"
    :type="type"
    :format="format"
    :value-format="valueFormat"
    :placeholder="placeholder"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :clearable="clearable"
    :readonly="readonly"
    :editable="editable"
    :prefix-icon="prefixIcon"
    :clear-icon="clearIcon"
    :shortcuts="shortcuts"
    :disabled-date="disabledDate"
    :cell-class-name="cellClassName"
    :range-separator="rangeSeparator"
    :default-value="defaultValue"
    :default-time="defaultTime"
    :teleported="teleported"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { ElDatePicker } from 'element-plus'
import type { FieldComponentProps } from '../types'
import type { Component } from 'vue'

export interface DatePickerShortcut {
  text: string
  value: Date | (() => Date)
}

export interface DatePickerProps extends FieldComponentProps {
  type?:
    | 'year'
    | 'years'
    | 'month'
    | 'months'
    | 'date'
    | 'dates'
    | 'datetime'
    | 'week'
    | 'datetimerange'
    | 'daterange'
    | 'monthrange'
    | 'yearrange'
  size?: 'large' | 'default' | 'small'
  format?: string
  valueFormat?: string
  placeholder?: string
  startPlaceholder?: string
  endPlaceholder?: string
  clearable?: boolean
  readonly?: boolean
  editable?: boolean
  prefixIcon?: string | Component
  clearIcon?: string | Component
  shortcuts?: DatePickerShortcut[]
  disabledDate?: (time: Date) => boolean
  cellClassName?: (time: Date) => string
  rangeSeparator?: string
  defaultValue?: Date | [Date, Date]
  defaultTime?: Date | [Date, Date]
  teleported?: boolean
}

const props = withDefaults(defineProps<DatePickerProps>(), {
  type: 'date',
  size: 'default',
  clearable: true,
  readonly: false,
  editable: true,
  rangeSeparator: '-',
  teleported: true
})

const emit = defineEmits<{
  change: [value: string | Date | (string | Date)[]]
}>()

const handleChange = (value: string | Date | (string | Date)[]) => {
  props.onChange?.(value)
  emit('change', value)
}
</script>

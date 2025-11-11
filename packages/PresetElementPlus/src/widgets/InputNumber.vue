<template>
  <el-input-number
    :model-value="value"
    @update:model-value="handleChange"
    :disabled="disabled"
    :placeholder="placeholder"
    :size="size"
    :min="min"
    :max="max"
    :step="step"
    :precision="precision"
    :controls="controls"
    :controls-position="controlsPosition"
    :readonly="readonly"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { ElInputNumber } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface InputNumberProps extends FieldComponentProps {
  size?: 'large' | 'default' | 'small'
  min?: number
  max?: number
  step?: number
  precision?: number
  controls?: boolean
  controlsPosition?: 'right' | ''
  readonly?: boolean
}

const props = withDefaults(defineProps<InputNumberProps>(), {
  size: 'default',
  step: 1,
  controls: true,
  controlsPosition: 'right',
  readonly: false
})

const emit = defineEmits<{
  change: [value: number | undefined]
}>()

const handleChange = (value: number | undefined) => {
  props.onChange?.(value)
  emit('change', value)
}
</script>

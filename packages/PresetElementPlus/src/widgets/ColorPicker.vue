<template>
  <el-color-picker
    :model-value="value"
    @update:model-value="handleChange"
    :disabled="disabled"
    :size="size"
    :show-alpha="showAlpha"
    :color-format="colorFormat"
    :predefine="predefine"
    v-bind="$attrs"
    @active-change="handleActiveChange"
  />
</template>

<script setup lang="ts">
import { ElColorPicker } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface ColorPickerProps extends FieldComponentProps {
  size?: 'large' | 'default' | 'small'
  showAlpha?: boolean
  colorFormat?: 'hsl' | 'hsv' | 'hex' | 'rgb'
  predefine?: string[]
  onActiveChange?: (color: string) => void
}

const props = withDefaults(defineProps<ColorPickerProps>(), {
  size: 'default',
  showAlpha: false,
  colorFormat: 'hex'
})

const emit = defineEmits<{
  change: [value: string | null]
  'active-change': [color: string]
}>()

const handleChange = (value: string | null) => {
  props.onChange?.(value)
  emit('change', value)
}

const handleActiveChange = (color: string) => {
  props.onActiveChange?.(color)
  emit('active-change', color)
}
</script>

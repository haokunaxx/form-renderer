<template>
  <el-slider
    :model-value="value"
    @update:model-value="handleChange"
    :disabled="disabled"
    :size="size"
    :min="min"
    :max="max"
    :step="step"
    :show-input="showInput"
    :show-input-controls="showInputControls"
    :show-stops="showStops"
    :show-tooltip="showTooltip"
    :format-tooltip="formatTooltip"
    :range="range"
    :vertical="vertical"
    :height="height"
    :marks="marks"
    v-bind="$attrs"
    @change="handleNativeChange"
  />
</template>

<script setup lang="ts">
import { ElSlider } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface SliderProps extends FieldComponentProps {
  size?: 'large' | 'default' | 'small'
  min?: number
  max?: number
  step?: number
  showInput?: boolean
  showInputControls?: boolean
  showStops?: boolean
  showTooltip?: boolean
  formatTooltip?: (value: number) => string
  range?: boolean
  vertical?: boolean
  height?: string
  marks?: Record<number, string | { style: Record<string, any>; label: string }>
}

const props = withDefaults(defineProps<SliderProps>(), {
  size: 'default',
  min: 0,
  max: 100,
  step: 1,
  showInput: false,
  showInputControls: true,
  showStops: false,
  showTooltip: true,
  range: false,
  vertical: false
})

const emit = defineEmits<{
  change: [value: number | number[]]
}>()

const handleChange = (value: number | number[]) => {
  props.onChange?.(value)
  emit('change', value)
}

const handleNativeChange = (value: number | number[]) => {
  // Element Plus Slider 的 change 事件在用户停止拖动时触发
  // 这里可以用于额外的处理
}
</script>

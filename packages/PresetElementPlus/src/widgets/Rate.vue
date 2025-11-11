<template>
  <el-rate
    :model-value="value"
    @update:model-value="handleChange"
    :disabled="disabled"
    :size="size"
    :max="max"
    :allow-half="allowHalf"
    :low-threshold="lowThreshold"
    :high-threshold="highThreshold"
    :colors="colors"
    :void-color="voidColor"
    :disabled-void-color="disabledVoidColor"
    :icons="icons"
    :void-icon="voidIcon"
    :disabled-void-icon="disabledVoidIcon"
    :show-text="showText"
    :show-score="showScore"
    :text-color="textColor"
    :texts="texts"
    :score-template="scoreTemplate"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { ElRate } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface RateProps extends FieldComponentProps {
  size?: 'large' | 'default' | 'small'
  max?: number
  allowHalf?: boolean
  lowThreshold?: number
  highThreshold?: number
  colors?: string[] | Record<number, string>
  voidColor?: string
  disabledVoidColor?: string
  icons?: string[] | Record<number, string>
  voidIcon?: string
  disabledVoidIcon?: string
  showText?: boolean
  showScore?: boolean
  textColor?: string
  texts?: string[]
  scoreTemplate?: string
}

const props = withDefaults(defineProps<RateProps>(), {
  size: 'default',
  max: 5,
  allowHalf: false,
  lowThreshold: 2,
  highThreshold: 4,
  showText: false,
  showScore: false
})

const emit = defineEmits<{
  change: [value: number]
}>()

const handleChange = (value: number) => {
  props.onChange?.(value)
  emit('change', value)
}
</script>

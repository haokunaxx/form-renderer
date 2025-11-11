<template>
  <el-switch
    :model-value="modelValue"
    @update:model-value="handleChange"
    :disabled="disabled"
    :size="size"
    :width="width"
    :inline-prompt="inlinePrompt"
    :active-text="activeText"
    :inactive-text="inactiveText"
    :active-value="activeValue"
    :inactive-value="inactiveValue"
    :active-color="activeColor"
    :inactive-color="inactiveColor"
    :border-color="borderColor"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { ElSwitch } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface SwitchProps extends FieldComponentProps {
  size?: 'large' | 'default' | 'small'
  width?: number | string
  inlinePrompt?: boolean
  activeText?: string
  inactiveText?: string
  activeValue?: boolean | string | number
  inactiveValue?: boolean | string | number
  activeColor?: string
  inactiveColor?: string
  borderColor?: string
}

const props = withDefaults(defineProps<SwitchProps>(), {
  size: 'default',
  inlinePrompt: false,
  activeValue: true,
  inactiveValue: false
})

const emit = defineEmits<{
  change: [value: boolean | string | number]
}>()

const handleChange = (value: boolean | string | number) => {
  props.onChange?.(value)
  emit('change', value)
}
</script>

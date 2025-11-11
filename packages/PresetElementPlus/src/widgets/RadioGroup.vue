<template>
  <el-radio-group
    :model-value="modelValue"
    @update:model-value="handleChange"
    :disabled="disabled"
    :size="size"
    v-bind="$attrs"
  >
    <el-radio
      v-for="option in options"
      :key="String(option.value)"
      :label="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </el-radio>
  </el-radio-group>
</template>

<script setup lang="ts">
import { ElRadioGroup, ElRadio } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface RadioOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export interface RadioGroupProps extends FieldComponentProps {
  modelValue: string | number | boolean
  options: RadioOption[]
  size?: 'large' | 'default' | 'small'
}

const props = withDefaults(defineProps<RadioGroupProps>(), {
  size: 'default',
  options: () => []
})

const emit = defineEmits<{
  change: [value: string | number | boolean]
}>()

const handleChange = (value: string | number | boolean | undefined) => {
  if (value !== undefined) {
    props.onChange?.(value)
    emit('change', value)
  }
}
</script>

<template>
  <el-checkbox-group
    :model-value="value"
    @update:model-value="handleChange"
    :disabled="disabled"
    :size="size"
    :min="min"
    :max="max"
    v-bind="$attrs"
  >
    <el-checkbox
      v-for="option in options"
      :key="String(option.value)"
      :label="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </el-checkbox>
  </el-checkbox-group>
</template>

<script setup lang="ts">
import { ElCheckboxGroup, ElCheckbox } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface CheckboxOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export interface CheckboxGroupProps extends FieldComponentProps {
  options: CheckboxOption[]
  size?: 'large' | 'default' | 'small'
  min?: number
  max?: number
}

const props = withDefaults(defineProps<CheckboxGroupProps>(), {
  size: 'default',
  options: () => []
})

const emit = defineEmits<{
  change: [value: (string | number | boolean)[]]
}>()

const handleChange = (value: (string | number | boolean)[]) => {
  console.log('----', value)
  props.onChange?.(value)
  emit('change', value)
}
</script>

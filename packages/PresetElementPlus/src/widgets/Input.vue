<template>
  <el-input
    :model-value="modelValue"
    @update:model-value="handleChange"
    :disabled="disabled"
    :placeholder="placeholder"
    :size="size"
    :clearable="clearable"
    :show-password="showPassword"
    :type="type"
    :maxlength="maxlength"
    :minlength="minlength"
    :show-word-limit="showWordLimit"
    :prefix-icon="prefixIcon"
    :suffix-icon="suffixIcon"
    :readonly="readonly"
    :autofocus="autofocus"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { ElInput } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface InputProps extends FieldComponentProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'
  size?: 'large' | 'default' | 'small'
  clearable?: boolean
  showPassword?: boolean
  maxlength?: number
  minlength?: number
  showWordLimit?: boolean
  prefixIcon?: string
  suffixIcon?: string
  readonly?: boolean
  autofocus?: boolean
}

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  size: 'default',
  clearable: false,
  showPassword: false,
  showWordLimit: false,
  readonly: false,
  autofocus: false
})

const emit = defineEmits<{
  change: [value: string]
}>()

const handleChange = (value: string) => {
  props.onChange?.(value)
  emit('change', value)
}
</script>

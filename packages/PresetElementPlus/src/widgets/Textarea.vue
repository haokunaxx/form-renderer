<template>
  <el-input
    :model-value="modelValue"
    @update:model-value="handleChange"
    type="textarea"
    :disabled="disabled"
    :placeholder="placeholder"
    :size="size"
    :rows="rows"
    :autosize="autosize"
    :maxlength="maxlength"
    :minlength="minlength"
    :show-word-limit="showWordLimit"
    :readonly="readonly"
    :autofocus="autofocus"
    :resize="resize"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { ElInput } from 'element-plus'
import type { FieldComponentProps } from '../types'

export interface TextareaProps extends FieldComponentProps {
  size?: 'large' | 'default' | 'small'
  rows?: number
  autosize?: boolean | { minRows?: number; maxRows?: number }
  maxlength?: number
  minlength?: number
  showWordLimit?: boolean
  readonly?: boolean
  autofocus?: boolean
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<TextareaProps>(), {
  size: 'default',
  rows: 3,
  autosize: false,
  showWordLimit: false,
  readonly: false,
  autofocus: false,
  resize: 'vertical'
})

const emit = defineEmits<{
  change: [value: string]
}>()

const handleChange = (value: string) => {
  props.onChange?.(value)
  emit('change', value)
}
</script>

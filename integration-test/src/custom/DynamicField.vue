<script setup lang="ts">
import { defineProps, defineEmits, computed, ref, useAttrs, watch } from 'vue'
import { ElInput, ElSelect, ElSwitch, ElDatePicker } from 'element-plus'

const props = defineProps<{
  type: string
  modelValue: any
  disabled: boolean
  readonly: boolean
}>()

const emit = defineEmits<{
  change: [value: any]
}>()

const attrs = useAttrs()

const internalValue = ref<any>(props.modelValue)

const component = computed(() => {
  return (
    {
      input: ElInput,
      select: ElSelect,
      switch: ElSwitch,
      'date-picker': ElDatePicker
    }[props.type] || ElInput
  )
})

const bindProps = computed(() => {
  return {
    ...attrs,
    disabled: props.disabled,
    readonly: props.readonly
  } as any
})

watch(
  () => props.type,
  (newVal) => {
    const defaultComponentValue = {
      input: '',
      select: '',
      switch: true,
      'date-picker': ''
    }
    internalValue.value =
      defaultComponentValue[newVal as keyof typeof defaultComponentValue]
    emit('change', internalValue.value)
  }
)

const handleUpdateModelValue = (value: any) => {
  internalValue.value = value
  emit('change', value)
}
</script>

<template>
  <component
    :is="component"
    v-bind="bindProps"
    :model-value="internalValue"
    @update:model-value="handleUpdateModelValue"
  />
</template>

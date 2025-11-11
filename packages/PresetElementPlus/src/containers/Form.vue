<template>
  <el-form
    ref="formRef"
    :model="modelValue"
    :rules="rules"
    :label-position="labelPosition"
    :label-width="labelWidth"
    :size="size"
    :disabled="disabled"
    :validate-on-rule-change="validateOnRuleChange"
    :hide-required-asterisk="hideRequiredAsterisk"
    :show-message="showMessage"
    :inline-message="inlineMessage"
    :status-icon="statusIcon"
    v-bind="$attrs"
    @validate="handleValidate"
  >
    <slot />
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FormInstance, FormValidateCallback } from 'element-plus'

interface Props {
  modelValue?: Record<string, any>
  rules?: Record<string, any>
  labelPosition?: 'left' | 'right' | 'top'
  labelWidth?: string | number
  size?: 'large' | 'default' | 'small'
  disabled?: boolean
  validateOnRuleChange?: boolean
  hideRequiredAsterisk?: boolean
  showMessage?: boolean
  inlineMessage?: boolean
  statusIcon?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'validate', prop: string, isValid: boolean, message: string): void
}

const props = withDefaults(defineProps<Props>(), {
  labelPosition: 'right',
  labelWidth: '100px',
  size: 'default',
  disabled: false,
  validateOnRuleChange: true,
  hideRequiredAsterisk: false,
  showMessage: true,
  inlineMessage: false,
  statusIcon: false
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()

// 处理表单验证事件
const handleValidate = (prop: string, isValid: boolean, message: string) => {
  emit('validate', prop, isValid, message)
}

// 暴露表单实例方法
const validate = (callback?: FormValidateCallback) => {
  return formRef.value?.validate(callback)
}

const validateField = (
  props: string | string[],
  callback?: FormValidateCallback
) => {
  return formRef.value?.validateField(props, callback)
}

const resetFields = () => {
  formRef.value?.resetFields()
}

const scrollToField = (prop: string) => {
  formRef.value?.scrollToField(prop)
}

const clearValidate = (props?: string | string[]) => {
  formRef.value?.clearValidate(props)
}

// 暴露给父组件使用
defineExpose({
  validate,
  validateField,
  resetFields,
  scrollToField,
  clearValidate,
  formRef
})
</script>

<style scoped>
.el-form {
  width: 100%;
}
</style>

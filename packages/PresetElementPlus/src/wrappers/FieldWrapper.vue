<template>
  <el-form-item
    :label="label"
    :prop="name"
    :required="required"
    :rules="formRules"
    :error="error"
    :show-message="showMessage"
    :inline-message="inlineMessage"
    :size="size"
    v-bind="$attrs"
  >
    <slot />

    <!-- 自定义错误信息显示 -->
    <template v-if="error && showCustomError" #error="{ error: errorMsg }">
      <div class="el-form-item__error-custom">
        {{ errorMsg }}
      </div>
    </template>
  </el-form-item>
</template>

<script setup lang="ts">
import { ElFormItem } from 'element-plus'
import { computed } from 'vue'

export interface FieldWrapperProps {
  label?: string
  name?: string
  required?: boolean
  error?: string
  showMessage?: boolean
  inlineMessage?: boolean
  size?: 'large' | 'default' | 'small'
  rules?: any[] // 从 Adapter 传入的 rules
  showCustomError?: boolean
}

const props = withDefaults(defineProps<FieldWrapperProps>(), {
  showMessage: true,
  inlineMessage: false,
  size: 'default',
  showCustomError: false,
  rules: () => []
})

// 构建表单验证规则
const formRules = computed(() => {
  // 直接使用从 Adapter 传入的 rules
  // Adapter 已经通过 ruleConverter 处理了 required 和 validators
  return props.rules && props.rules.length > 0 ? props.rules : undefined
})
</script>

<style scoped>
.el-form-item__error-custom {
  padding-top: 4px;
  font-size: 12px;
  line-height: 1;
  color: var(--el-color-danger);
}
</style>

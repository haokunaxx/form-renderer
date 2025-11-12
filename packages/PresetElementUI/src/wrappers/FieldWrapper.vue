<template>
  <el-form-item
    :label="label"
    :prop="name"
    :rules="formRules"
    :error="error"
    :show-message="showMessage"
    :validate-event="false"
    :size="size"
    v-bind="$attrs"
  >
    <slot />
  </el-form-item>
</template>

<script>
/**
 * 字段包装器
 * 用于包装字段组件，提供表单项标签、校验等功能
 */
export default {
  name: 'FieldWrapper',

  props: {
    label: {
      type: String,
      default: undefined
    },
    name: {
      type: String,
      default: undefined
    },
    required: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: undefined
    },
    showMessage: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['medium', 'small', 'mini'].includes(value)
    },
    rules: {
      type: Array,
      default: () => []
    }
  },

  computed: {
    /**
     * 构建表单验证规则
     */
    formRules() {
      // 直接使用从 Adapter 传入的 rules
      // Adapter 已经通过 ruleConverter 处理了 required 和 validators
      console.log('---> FieldWrapper formRules', this.rules)
      return this.rules && this.rules.length > 0 ? this.rules : undefined
    }
  }
}
</script>

<style scoped>
.el-form-item__error {
  padding-top: 4px;
  font-size: 12px;
  line-height: 1;
}
</style>

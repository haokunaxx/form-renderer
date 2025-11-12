<template>
  <el-form
    ref="formRef"
    :model="model"
    :rules="rules"
    :label-position="labelPosition"
    :label-width="labelWidth"
    :label-suffix="labelSuffix"
    :inline="inline"
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

<script>
/**
 * 表单容器组件
 */
export default {
  name: 'ContainerForm',

  props: {
    model: {
      type: Object,
      default: () => ({})
    },
    rules: {
      type: Object,
      default: () => ({})
    },
    labelPosition: {
      type: String,
      default: 'right',
      validator: (value) => ['left', 'right', 'top'].includes(value)
    },
    labelWidth: {
      type: String,
      default: '100px'
    },
    labelSuffix: {
      type: String,
      default: undefined
    },
    inline: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['medium', 'small', 'mini'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    validateOnRuleChange: {
      type: Boolean,
      default: true
    },
    hideRequiredAsterisk: {
      type: Boolean,
      default: false
    },
    showMessage: {
      type: Boolean,
      default: true
    },
    inlineMessage: {
      type: Boolean,
      default: false
    },
    statusIcon: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    handleValidate(prop, isValid, message) {
      // this.$emit('validate', prop, isValid, message)
    },

    // 暴露表单实例方法
    validate(callback) {
      // return this.$refs.formRef.validate(callback)
    },

    validateField(props, callback) {
      return this.$refs.formRef.validateField(props, callback)
    },

    resetFields() {
      this.$refs.formRef.resetFields()
    },

    clearValidate(props) {
      this.$refs.formRef.clearValidate(props)
    }
  },
  watch: {
    model(newVal) {
      console.log('---> Form model', newVal)
    }
  }
}
</script>

<style scoped>
.el-form {
  width: 100%;
}
</style>

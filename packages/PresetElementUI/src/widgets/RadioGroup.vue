<template>
  <el-radio-group
    :value="value"
    @change="handleChange"
    :disabled="disabled"
    :size="size"
    v-bind="$attrs"
  >
    <el-radio
      v-for="option in options"
      :key="option.value"
      :label="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </el-radio>
  </el-radio-group>
</template>

<script>
/**
 * 单选框组组件
 */
export default {
  name: 'WidgetRadioGroup',

  props: {
    value: {
      type: [String, Number, Boolean],
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['large', 'medium', 'small', 'mini'].includes(value)
    },
    options: {
      type: Array,
      default: () => []
    },
    onChange: {
      type: Function,
      default: undefined
    }
  },

  methods: {
    handleChange(value) {
      if (this.onChange) {
        this.onChange(value)
      }
      this.$emit('change', value)
    }
  }
}
</script>

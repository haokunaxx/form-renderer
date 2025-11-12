<template>
  <el-input-number
    :value="value"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    :disabled="disabled"
    :size="size"
    :min="min"
    :max="max"
    :step="step"
    :step-strictly="stepStrictly"
    :precision="precision"
    :controls="controls"
    :controls-position="controlsPosition"
    :placeholder="placeholder"
    v-bind="$attrs"
  />
</template>

<script>
/**
 * 数字输入框组件
 */
export default {
  name: 'WidgetInputNumber',

  props: {
    value: {
      type: Number,
      default: undefined
    },
    disabled: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['large', 'medium', 'small'].includes(value)
    },
    min: {
      type: Number,
      default: -Infinity
    },
    max: {
      type: Number,
      default: Infinity
    },
    step: {
      type: Number,
      default: 1
    },
    stepStrictly: {
      type: Boolean,
      default: false
    },
    precision: {
      type: Number,
      default: undefined
    },
    controls: {
      type: Boolean,
      default: true
    },
    controlsPosition: {
      type: String,
      default: undefined,
      validator: (value) => !value || ['right'].includes(value)
    },
    placeholder: {
      type: String,
      default: '请输入数字'
    },
    onChange: {
      type: Function,
      default: undefined
    },
    onBlur: {
      type: Function,
      default: undefined
    },
    onFocus: {
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
    },

    handleBlur(event) {
      if (this.onBlur) {
        this.onBlur(event)
      }
      this.$emit('blur', event)
    },

    handleFocus(event) {
      if (this.onFocus) {
        this.onFocus(event)
      }
      this.$emit('focus', event)
    }
  }
}
</script>

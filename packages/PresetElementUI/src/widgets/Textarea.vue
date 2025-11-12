<template>
  <el-input
    type="textarea"
    :value="value"
    @input="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    :disabled="disabled"
    :placeholder="placeholder"
    :rows="rows"
    :autosize="autosize"
    :maxlength="maxlength"
    :minlength="minlength"
    :show-word-limit="showWordLimit"
    :readonly="readonly"
    :autofocus="autofocus"
    v-bind="$attrs"
  />
</template>

<script>
/**
 * 多行文本输入框组件
 */
export default {
  name: 'WidgetTextarea',

  props: {
    value: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '请输入'
    },
    rows: {
      type: Number,
      default: 3
    },
    autosize: {
      type: [Boolean, Object],
      default: false
    },
    maxlength: {
      type: Number,
      default: undefined
    },
    minlength: {
      type: Number,
      default: undefined
    },
    showWordLimit: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    autofocus: {
      type: Boolean,
      default: false
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

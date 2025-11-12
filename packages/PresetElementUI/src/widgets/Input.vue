<template>
  <el-input
    :value="value"
    @change="handleChange"
    @input="handleInput"
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

<script>
/**
 * 输入框组件
 */
export default {
  name: 'WidgetInput',

  props: {
    value: {
      type: [String, Number],
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
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['large', 'medium', 'small', 'mini'].includes(value)
    },
    clearable: {
      type: Boolean,
      default: false
    },
    showPassword: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'text'
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
    prefixIcon: {
      type: String,
      default: undefined
    },
    suffixIcon: {
      type: String,
      default: undefined
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
      console.log('---> input widget handleChange', value)
      this.onChange?.(value)
      this.$emit('change', value)
    },

    handleInput(value) {
      console.log('---> input widget handleInput', value)
      this.onInput?.(value)
      this.$emit('change', value)
    }
    // handleBlur(event) {
    //   if (this.onBlur) {
    //     this.onBlur(event)
    //   }
    //   this.$emit('blur', event)
    // },

    // handleFocus(event) {
    //   if (this.onFocus) {
    //     this.onFocus(event)
    //   }
    //   this.$emit('focus', event)
    // }
  }
}
</script>
